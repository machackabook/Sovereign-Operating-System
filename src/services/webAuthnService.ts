/**
 * WebAuthn Service - Browser Biometric Auth Wrapper
 */
export const webAuthnService = {
  // Simple challenge for demonstration as a client-side prototype
  generateChallenge: () => Uint8Array.from(crypto.getRandomValues(new Uint8Array(32))),

  async register(username: string): Promise<Credential | null> {
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: this.generateChallenge(),
      rp: { name: "HyperTerminal OS", id: window.location.hostname },
      user: {
        id: new Uint8Array([1, 2, 3, 4]), // Placeholder ID
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: { userVerification: "required" },
    };

    try {
      return await navigator.credentials.create({ publicKey: publicKeyOptions });
    } catch (err) {
      console.error("Biometric registration failed:", err);
      return null;
    }
  },

  async authenticate(): Promise<Credential | null> {
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge: this.generateChallenge(),
      allowCredentials: [], // In production, this would contain stored credentials
      userVerification: "required",
    };

    try {
      return await navigator.credentials.get({ publicKey: publicKeyOptions });
    } catch (err) {
      console.error("Biometric authentication failed:", err);
      return null;
    }
  },
};
