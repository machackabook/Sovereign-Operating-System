import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { audioVoiceService } from "./audioVoiceService";
import { crypticMeshService } from "./crypticMeshService";

export interface EnvironmentalSensorData {
  noiseFloorDbfs: number | null;
  microphoneLevel: number | null;
  estimatedProximityMeters: number | null;
  deviceOrientation: { alpha: number | null; beta: number | null; gamma: number | null };
  ambientLightLux: number | null;
  acousticEchoLatencyMs: number | null;
  rfHarmonicIndex: number | null;
  motionIntensity: number | null;
  timestamp: number;
}

export interface VoiceAuthStatus {
  isAuthenticated: boolean;
  username: string | null;
  /** Optional phrase challenge state; never an identity factor. */
  activationPhraseMatched: boolean;
  /** @deprecated Compatibility alias for activationPhraseMatched. */
  voiceMatched: boolean;
  allPathsUnlocked: boolean;
  lastVerifiedAt: number | null;
  activeVoiceProfile: string;
  /** Null means no real environmental-match measurement is available. */
  environmentalMatch: boolean | null;
  /** No voice-biometric confidence is computed by this service. */
  confidence: number | null;
  accessAssertionVerified: boolean;
}

type AuthResult = { verified: boolean; message: string };

class VoiceAuthGateService {
  private authenticatedUser: string | null = null;
  private identityVerified = false;
  private accessAssertionVerified = false;
  private activationPhraseMatched = false;
  private allPathsUnlocked = false;
  private lastVerifiedAt: number | null = null;
  private bridgeExpiresAt: number | null = null;
  private readonly activationPhrase = "open sovereign matrix";
  private sensorData: EnvironmentalSensorData = {
    noiseFloorDbfs: null,
    microphoneLevel: null,
    estimatedProximityMeters: null,
    deviceOrientation: { alpha: null, beta: null, gamma: null },
    ambientLightLux: null,
    acousticEchoLatencyMs: null,
    rfHarmonicIndex: null,
    motionIntensity: null,
    timestamp: Date.now(),
  };
  private listeners: Array<(status: VoiceAuthStatus) => void> = [];

  constructor() {
    this.initSensorListeners();
    onAuthStateChanged(auth, (user) => {
      const validGoogleUser = !!user &&
        !user.isAnonymous &&
        user.emailVerified &&
        !!user.email &&
        user.providerData.some((provider) => provider.providerId === "google.com");
      if (!validGoogleUser || (this.authenticatedUser && user?.email !== this.authenticatedUser)) {
        const hadBridgeSession = this.identityVerified;
        this.clearIdentityState();
        if (hadBridgeSession) void crypticMeshService.revoke().catch(() => undefined);
      }
      this.notify();
    });
  }

  private clearIdentityState(): void {
    this.authenticatedUser = null;
    this.identityVerified = false;
    this.accessAssertionVerified = false;
    this.activationPhraseMatched = false;
    this.allPathsUnlocked = false;
    this.lastVerifiedAt = null;
    this.bridgeExpiresAt = null;
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public subscribe(listener: (status: VoiceAuthStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  /**
   * A spoken phrase is only an interaction challenge. It is public in the UI
   * and is never treated as identity, a biometric, or an authorization factor.
   */
  public verifyVoice(transcript: string): { verified: boolean; score: number; message: string } {
    const normalized = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const recognized = normalized.includes(this.activationPhrase);
    this.activationPhraseMatched = recognized;
    this.notify();
    return {
      verified: recognized,
      score: recognized ? 1 : 0,
      message: recognized
        ? "Activation phrase recognized. Google and Cloudflare Access identity verification is still required."
        : "Activation phrase not recognized. No access has been granted.",
    };
  }

  /**
   * Cryptic is the authority for the combined Firebase Google + Cloudflare
   * Access exchange. A browser passphrase can never substitute for this call.
   */
  public async verifyIdentity(): Promise<AuthResult> {
    const user = auth.currentUser;
    const validGoogleUser = !!user &&
      !user.isAnonymous &&
      user.emailVerified &&
      !!user.email &&
      user.providerData.some((provider) => provider.providerId === "google.com");

    if (!validGoogleUser || !user) {
      this.clearIdentityState();
      this.notify();
      return {
        verified: false,
        message: "Sign in with the verified Google account before accessing protected content.",
      };
    }

    try {
      const result = await crypticMeshService.connect();
      if (!result.connected || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) {
        throw new Error("Cryptic identity exchange did not return a valid short-lived bridge session.");
      }
      this.bridgeExpiresAt = result.expiresAt;
      this.authenticatedUser = user.email;
      this.identityVerified = true;
      this.accessAssertionVerified = true;
      this.allPathsUnlocked = true;
      this.lastVerifiedAt = Date.now();
      this.notify();
      return {
        verified: true,
        message: "Verified Google identity and Cloudflare Access assertion through Cryptic.",
      };
    } catch (error: any) {
      this.clearIdentityState();
      this.notify();
      return {
        verified: false,
        message: error?.message || "Identity verification failed. Check Google sign-in and the Cloudflare Access session.",
      };
    }
  }

  /** Compatibility alias: this now performs real identity verification. */
  public loginUser(): Promise<AuthResult> {
    return this.verifyIdentity();
  }

  public logoutUser(): void {
    this.clearIdentityState();
    void crypticMeshService.revoke().catch(() => undefined);
    this.notify();
  }

  public unlockAllPaths(unlocked = true): boolean {
    if (!unlocked) {
      this.logoutUser();
      return true;
    }
    if (!this.identityVerified || !this.accessAssertionVerified) {
      this.allPathsUnlocked = false;
      this.notify();
      return false;
    }
    this.allPathsUnlocked = true;
    this.notify();
    return true;
  }

  public isAuthorized(): boolean {
    if (
      this.identityVerified &&
      this.bridgeExpiresAt !== null &&
      Date.now() >= this.bridgeExpiresAt
    ) {
      this.clearIdentityState();
      void crypticMeshService.revoke().catch(() => undefined);
      return false;
    }
    return this.identityVerified &&
      this.accessAssertionVerified &&
      this.allPathsUnlocked &&
      this.bridgeExpiresAt !== null &&
      Date.now() < this.bridgeExpiresAt;
  }

  public isProtectedDocument(path: string): boolean {
    const protectedPatterns = [
      /\/docs\//i,
      /(^|\/)(architecture|soul)\.md$/i,
      /\.secret$/i,
      /\/vault\//i,
    ];
    return protectedPatterns.some((pattern) => pattern.test(path)) && !this.isAuthorized();
  }

  public getStatus(): VoiceAuthStatus {
    const authorized = this.isAuthorized();
    return {
      isAuthenticated: authorized,
      username: authorized ? this.authenticatedUser : null,
      activationPhraseMatched: this.activationPhraseMatched,
      voiceMatched: this.activationPhraseMatched,
      allPathsUnlocked: authorized,
      lastVerifiedAt: authorized ? this.lastVerifiedAt : null,
      activeVoiceProfile: audioVoiceService.getCurrentProfile().name,
      environmentalMatch: null,
      confidence: null,
      accessAssertionVerified: authorized && this.accessAssertionVerified,
    };
  }

  /** Return only sensor values actually observed on this device. */
  public getSensorTelemetry(): EnvironmentalSensorData {
    const micData = audioVoiceService.getMicrophoneAudioData();
    this.sensorData.microphoneLevel = micData ? micData.volume : null;
    this.sensorData.timestamp = Date.now();
    return { ...this.sensorData, deviceOrientation: { ...this.sensorData.deviceOrientation } };
  }

  private initSensorListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("deviceorientation", (event) => {
      const orientation = event as DeviceOrientationEvent;
      this.sensorData.deviceOrientation = {
        alpha: Number.isFinite(orientation.alpha) ? orientation.alpha : null,
        beta: Number.isFinite(orientation.beta) ? orientation.beta : null,
        gamma: Number.isFinite(orientation.gamma) ? orientation.gamma : null,
      };
      this.sensorData.timestamp = Date.now();
    });

    window.addEventListener("devicemotion", (event) => {
      const motion = event as DeviceMotionEvent;
      const acceleration = motion.acceleration;
      if (acceleration && acceleration.x !== null && acceleration.y !== null && acceleration.z !== null) {
        this.sensorData.motionIntensity = Math.sqrt(
          acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
        );
        this.sensorData.timestamp = Date.now();
      }
    });
  }
}

export const voiceAuthGateService = new VoiceAuthGateService();
