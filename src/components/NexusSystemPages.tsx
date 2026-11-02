import React, {useCallback,useEffect,useState} from 'react';
import { X, Link2, Network, RefreshCcw, Terminal, LockKeyhole, ExternalLink, Bluetooth } from 'lucide-react';
import { quineMeshService } from '../services/quineMeshService.mjs';
import { gaiaMeshV4 } from '../services/gaiaMeshSyncV4.mjs';
import { pllmSensorAgent } from '../services/pllmSensorAgent.mjs';
import { geoNexusService } from '../services/geoNexusService';
import { gaiaCommsState } from '../services/gaiaCommsState.mjs';
import { causalCore } from '../services/causalCore.mjs';
import { bluetoothDeviceManager, BleDeviceRecord } from '../services/bluetoothDeviceManager';
import {
 SYSTEM_PAGES,routeFromHash,openSystemPage,systemPageURL,nexusSystemPageMesh,
 isPageTerminalCommand
} from '../services/nexusSystemRouter.mjs';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { SystemDiagnostics } from './SystemDiagnostics';
import { pluginManagerService } from '../services/pluginManagerService';
import { vfsPackageManager } from '../services/vfsPackageManager';
import { nexusColabDriveBridge } from '../services/nexusColabDriveBridge';
import { modelSourceLinkRegistry } from '../services/modelSourceLinkRegistry';
import { allDriversService } from '../services/allDriversService';
import { ravenEyeEngineService } from '../services/raveneytePulseEngine';
import { registryDatabaseService } from '../services/registryDatabaseService';
import { fileSystemBootChain } from '../services/fileSystemBootChain';
import { vgsFileExplorerService } from '../services/vgsFileExplorerService';
import { polyglotEncodingEngine } from '../services/polyglotEncodingEngine';

const BTN='rounded-md border border-cyan-400/40 bg-slate-900/80 px-2 py-1.5 text-xs text-cyan-100 hover:bg-slate-800 disabled:opacity-40';
type Page = typeof SYSTEM_PAGES[number];

function getPageView(slug:string){
 const publicMesh=gaiaMeshV4.snapshot();
 const related=publicMesh.nodes.find((n:any)=>n.id===SYSTEM_PAGES.find((p:Page)=>p.slug===slug)?.node);
 const tethers=publicMesh.links.filter((e:any)=>e.from===related?.id||e.to===related?.id);
 return {node:related||null,tethers,
  sourceCount:publicMesh.nodes.length,relationCount:publicMesh.links.length};
}

export function NexusSystemPages(){
 const [page,setPage]=useState<Page|null>(null);
 const [scope,setScope]=useState<any>(nexusSystemPageMesh.snapshot());
 const [pair,setPair]=useState<any>(quineMeshService.status());
 const [view,setView]=useState<any>(null);
 const [live,setLive]=useState<any>(null);
 const [bleDevices,setBleDevices]=useState<BleDeviceRecord[]>(bluetoothDeviceManager.getDevices());
 const [working,setWorking]=useState(false);
 const [issue,setIssue]=useState('');
 const [meshRev,setMeshRev]=useState(gaiaMeshV4.snapshot().revision);
 const [lastUpdate,setLastUpdate]=useState<string>('');
 const [linkNotice,setLinkNotice]=useState('');
 const active=page?.slug||'';
 const readPage=useCallback(async (slug:string)=>{
   // Local services only. Never fetch arbitrary target URLs from a system page.
   const host=quineMeshService.status();
   if(['terrasphere','sensor','canvas','singularity','voip','invite','bluetooth','plugins','packages','colab','triggers','drivers','raveneyte','registry','bootchain','vgs'].includes(slug)){
     if(slug==='vgs') return { source: 'vgs-gifile-explorer', filesCount: vgsFileExplorerService.getGiFiles().length, polyglotArtifactsCount: polyglotEncodingEngine.getArtifacts().length, files: vgsFileExplorerService.getGiFiles() };
     if(slug==='registry') return { source: 'registry-database-service', hives: Array.from(registryDatabaseService.getHives().keys()), hklmBuild: registryDatabaseService.getValue('HKLM\\SOFTWARE\\SovereignOS\\Version', 'BuildNumber') };
     if(slug==='bootchain') return { source: 'file-system-bootchain', bootStatus: fileSystemBootChain.verifyAndExecuteBootChain() };
     if(slug==='raveneyte') return { source: 'raveneyte-pulse-engine', latest: ravenEyeEngineService.getTelemetry().getLatest(), totalSnapshotEvents: ravenEyeEngineService.getTelemetry().snapshot().length };
     if(slug==='drivers') return { source: 'all-drivers-service', count: allDriversService.getAllDrivers().length, drivers: allDriversService.getAllDrivers() };
     if(slug==='plugins') return { source: 'plugin-manager', count: pluginManagerService.getPlugins().length, plugins: pluginManagerService.getPlugins() };
     if(slug==='packages') return { source: 'vfs-package-manager', lockState: vfsPackageManager.getSystemLockState(), packages: vfsPackageManager.getPackages() };
     if(slug==='colab') return { source: 'nexus-colab-drive-bridge', tunnelStatus: nexusColabDriveBridge.getTunnelStatus(), receiptsCount: nexusColabDriveBridge.getReceipts().length };
     if(slug==='triggers') return { source: 'model-source-link-registry', count: modelSourceLinkRegistry.getTriggers().length, triggers: modelSourceLinkRegistry.getTriggers().map(t => ({ id: t.id, name: t.name, target: t.targetFunction })) };
     if(slug==='bluetooth')return {
       source: 'web-bluetooth-device-manager',
       status: bluetoothDeviceManager.getStatus(),
       devices: bluetoothDeviceManager.getDevices().map(d => ({
         id: d.id,
         name: d.name,
         connectionState: d.connectionState,
         rssi: d.rssi,
         estimatedDistanceMeters: d.estimatedDistanceMeters,
         batteryLevel: d.batteryLevel,
         isSimulated: d.isSimulated,
         servicesCount: d.serviceUuids.length,
         spatialOrbitRadius: Math.round(d.spatialPosition.orbitRadius)
       }))
     };
     if(slug==='terrasphere')return {source:'browser-geolocation',state:geoNexusService.getTelemetry(),
        verifiedDeviceIdentity:false};
     if(slug==='sensor')return pllmSensorAgent.summary();
     if(slug==='voip')return gaiaCommsState.snapshot();
     if(slug==='singularity')return {source:'browser-numerical-core',status:causalCore.status(),
       notes:'Local mathematical observation; not hardware attestation'};
     if(slug==='invite')return {source:'browser-presentational-link',
       realSessionRequiredForCalling:true,mediaPermissionIsUserControlled:true};
     return {source:'browser-mesh',frame:gaiaMeshV4.snapshot().counts};
   }
   if(host.state!=='connected'){
     return {state:'not-connected',source:'authentication-boundary',
       message:'Pair this device with its local Quine bridge to read private/live host state.'};
   }
   const fn:Record<string,()=>Promise<any>>={
     terminal:()=>Promise.resolve(quineMeshService.status()),
     god:()=>quineMeshService.godStatus(),
     forge:()=>quineMeshService.forgeStatus(),
     memory:()=>quineMeshService.scribeStatus(),
     scribe:()=>quineMeshService.scribeStatus(),
     mcp:()=>quineMeshService.mcpCatalog(),
     ollama:()=>quineMeshService.localAIStatus(),
     resonance:()=>quineMeshService.runtimeStatus(),
     calibration:()=>quineMeshService.runtimeStatus(),
     neutronality:()=>quineMeshService.scribeStatus(),
   };
   if(!fn[slug])return {state:'unsupported',message:'No verified live source is connected'};
   return await fn[slug]();
 },[]);
 const refresh=useCallback(async (slug:string)=>{
   if(!slug)return;
   setWorking(true);setIssue('');
   try{
     const data=await readPage(slug);
     setLive(data);setLastUpdate(new Date().toLocaleTimeString());
   }catch(err:any){
     setLive(null);setIssue(String(err?.message||err));
   }finally{setWorking(false)}
 },[readPage]);

 useEffect(()=>{
   const observeRoute=()=>{
     const route=routeFromHash(window.location.hash) as Page|null;
     setPage(route);setView(route?getPageView(route.slug):null);
     setLive(null);
     if(route){nexusSystemPageMesh.record(route.slug,'opened');}
   };
   const onOpen=(e:Event)=>{
     const detail=(e as CustomEvent).detail;
     if(typeof detail?.slug==='string')openSystemPage(detail.slug);
   };
   const onInstance=(e:Event)=>{
     const id=(e as CustomEvent).detail?.id;
     try{nexusSystemPageMesh.attachInstance(id)}catch{}
   };
   observeRoute();
   window.addEventListener('hashchange',observeRoute);
   window.addEventListener('nexus:open-system-page',onOpen);
   window.addEventListener('nexus:terminal-instance',onInstance);
   const offScope=nexusSystemPageMesh.subscribe(setScope);
   const offPair=quineMeshService.subscribe((s:any)=>{
      setPair(s);nexusSystemPageMesh.pair(s);
   });
   const offGraph=gaiaMeshV4.subscribe((s:any)=>{
     setMeshRev(s.revision);
     const current=routeFromHash(window.location.hash);
     setView(current?getPageView(current.slug):null);
   });
   const offComms=gaiaCommsState.subscribe(()=>setMeshRev((x:number)=>x+1));
   const offGeo=geoNexusService.onTelemetryChange(()=>setMeshRev((x:number)=>x+1));
   const offBle=bluetoothDeviceManager.subscribe((devs)=>{
     setBleDevices([...devs]);
     setMeshRev((x:number)=>x+1);
   });
   nexusSystemPageMesh.pair(quineMeshService.status());
   return()=>{
     window.removeEventListener('hashchange',observeRoute);
     window.removeEventListener('nexus:open-system-page',onOpen);
     window.removeEventListener('nexus:terminal-instance',onInstance);
     offScope();offPair();offGraph();offComms();offGeo();offBle();
   };
 },[]);
 useEffect(()=>{
   if(!active)return;
   void refresh(active);
 },[active,pair.state,pair.host?.node_session,meshRev,refresh]);
 async function copyLink(){
   if(!page)return;
   const url=systemPageURL(page.slug,window.location);
   try{await navigator.clipboard.writeText(url);setLinkNotice('Page link copied. No session credentials are included.')}
   catch{setLinkNotice(url)}
 }
 function command(){
   if(!page)return;
   if(!isPageTerminalCommand(page.command))return;
   // Trusted fixed grammar, never an untrusted URL or free-form command.
   window.dispatchEvent(new CustomEvent('nexus:terminal-command',{
      detail:{command:page.command,origin:'system-pages'}
   }));
   nexusSystemPageMesh.record(page.slug,'terminal-linked');
   if(page.command==='xcard open')window.dispatchEvent(new Event('gaia:open-x-card'));
 }
 if(!page)return(
   <button type="button" className="pointer-events-auto fixed bottom-3 left-3 z-40 rounded-xl border border-cyan-500/40 bg-slate-950/85 px-3 py-2 text-xs text-cyan-100"
      onClick={()=>openSystemPage('terminal')} title="Open sixteen synchronized system pages">
      <Network size={14} className="inline mr-1"/> SYSTEM PAGES
   </button>
 );
 const node=view?.node;
 const peers=view?.tethers||[];
 return <aside role="dialog" aria-label={'GAIA system page '+page.title}
  className="pointer-events-auto fixed inset-x-2 top-10 bottom-2 z-[80] mx-auto flex max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-cyan-400/50 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl">
  <header className="flex items-center justify-between gap-2 border-b border-cyan-500/20 px-3 py-2">
    <div>
      <strong className="text-sm text-cyan-100">{page.title}</strong>
      <p className="text-[11px] text-slate-400">GAIA Mesh v4 · {page.group} · separate shareable page</p>
    </div>
    <div className="flex items-center gap-2">
      <button className={BTN} onClick={copyLink} title="Copy page URL"><Link2 size={15}/></button>
      <button className={BTN} onClick={()=>refresh(page.slug)} disabled={working} title="Refresh live source">
        <RefreshCcw size={15} className={working?'animate-spin':''}/>
      </button>
      <button className={BTN} aria-label="Close system page"
        onClick={()=>{window.location.hash='#/terminal';setPage(null)}}><X size={16}/></button>
    </div>
  </header>
  <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)]">
    <nav aria-label="System pages" className="flex max-h-40 gap-1 overflow-x-auto border-b border-slate-700 p-2 md:max-h-none md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
      {SYSTEM_PAGES.map((item:Page)=><button key={item.slug} type="button"
        onClick={()=>openSystemPage(item.slug)}
        aria-current={item.slug===page.slug?'page':undefined}
        className={'shrink-0 rounded-lg border px-3 py-2 text-left text-xs md:w-full '+
         (item.slug===page.slug?'border-cyan-400 bg-cyan-900/35 text-white':'border-slate-800 text-slate-300 hover:border-cyan-700')}>
        {item.title}
      </button>)}
    </nav>
    <div className="min-h-0 overflow-y-auto p-3 md:p-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <h3 className="mb-2 text-sm font-semibold text-cyan-200"><LockKeyhole size={14} className="inline"/> User & instance scope</h3>
          <p className="text-xs text-slate-300">
            {scope.hostAuthenticated?'Authenticated to paired local host':'Not paired with a local host'}
          </p>
          <p className="mt-2 break-all text-[11px] text-slate-400">Terminal instance: {scope.terminalInstance}</p>
          <p className="break-all text-[11px] text-slate-400">
             Host session: {scope.hostSession?scope.hostSession.slice(0,10)+'…':'none'}
          </p>
          <p className="mt-2 text-[11px] text-amber-200">
            Website account identity: not verified. This page does not assume a Google, GitHub,
            or ChatGPT sign-in authorizes private GAIA data.
          </p>
          <p className="mt-2 text-[11px] text-slate-500">No bearer token or private memory is embedded in this URL.</p>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <h3 className="mb-2 text-sm font-semibold text-cyan-200">Source & graph tethers</h3>
          {node?<div className="text-[11px]">
            <p className="text-slate-300">{node.id} · {node.status}</p>
            <a className="mt-1 flex items-center gap-1 break-all text-cyan-300 underline" href={node.sourceRef}
              target="_blank" rel="noopener noreferrer">Source code reference <ExternalLink size={12}/></a>
          </div>:<p className="text-xs text-slate-400">This page is awaiting a matching Mesh v4 node.</p>}
          <p className="mt-2 text-xs text-slate-300">{peers.length} declared graph tethers</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {peers.slice(0,15).map((e:any,i:number)=><span key={i} className="rounded border border-cyan-900 px-2 py-1 text-[10px] text-cyan-200">
              {e.from===node?.id?e.to:e.from} · {e.type}
            </span>)}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Source links do not establish running or authenticated connections.</p>
        </section>
      </div>
      <section className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-cyan-200">Live instance readback</h3>
          <div className="flex gap-2">
            <button className={BTN} onClick={command}><Terminal size={13} className="inline"/> Run terminal: {page.command}</button>
            {page.slug==='terrasphere'&&
              <button className={BTN} onClick={()=>void geoNexusService.syncTerminalWithGeo().catch((e:any)=>setIssue(String(e?.message||e)))}>
                Request this device's location
              </button>}
            {page.slug==='voip'&&<button className={BTN} onClick={()=>window.dispatchEvent(new Event('gaia:open-x-card'))}>
               Open call card
            </button>}
            {page.slug==='spectrum'&&<button className={BTN} onClick={()=>window.dispatchEvent(new Event('gaia:open-visual-spectrum'))}>
               Toggle spectrum live
            </button>}
            {page.slug==='bluetooth'&&<button className={BTN} onClick={async ()=>{
               const res=await bluetoothDeviceManager.discoverAndPairDevice();
               if(!res.success)setIssue(res.message);
               else void refresh('bluetooth');
            }}>
               <Bluetooth size={13} className="inline mr-1"/> Discover BLE Device
            </button>}
          </div>
        </div>
        <p className="mb-2 text-[11px] text-slate-500">
          {lastUpdate?'Latest source read: '+lastUpdate:'No source read'} · {working?'reading…':'idle'}
        </p>
        {issue&&<p role="alert" className="mb-2 text-xs text-rose-300">{issue}</p>}
        {page.slug==='spectrum' ? (
          <SpectrumAnalyzer />
        ) : page.slug==='diagnostics' ? (
          <SystemDiagnostics />
        ) : page.slug==='bluetooth' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border border-cyan-500/30 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200">WEB BLUETOOTH ROSTER &amp; GATT ORCHESTRATION</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live connection states, signal attenuation proximity, and 3D VisualRenderer presence.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 text-xs transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                  onClick={async () => {
                    const res = await bluetoothDeviceManager.discoverAndPairDevice();
                    if (!res.success) setIssue(res.message);
                    else void refresh('bluetooth');
                  }}
                >
                  <Bluetooth size={14} />
                  <span>Discover &amp; Pair BLE Device</span>
                </button>
              </div>
            </div>

            {/* Device Roster Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">Peripheral Name</th>
                    <th className="p-2.5">Device ID</th>
                    <th className="p-2.5">Connection State</th>
                    <th className="p-2.5">RSSI / Est. Distance</th>
                    <th className="p-2.5">Battery</th>
                    <th className="p-2.5">3D Spatial Position</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bleDevices.map((dev) => (
                    <tr key={dev.id} className="hover:bg-cyan-950/20 transition">
                      <td className="p-2.5 font-bold text-cyan-300 flex items-center gap-2">
                        <Bluetooth className={`w-3.5 h-3.5 ${dev.connectionState === 'connected' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{dev.name}</span>
                        {dev.isSimulated && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800">SIM</span>
                        )}
                      </td>
                      <td className="p-2.5 text-[10.5px] text-slate-400 max-w-[130px] truncate">{dev.id}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            dev.connectionState === 'connected'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : dev.connectionState === 'connecting'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {dev.connectionState}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${dev.rssi > -60 ? 'text-emerald-400' : dev.rssi > -75 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {dev.rssi} dBm
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (~{dev.estimatedDistanceMeters}m)
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        {dev.batteryLevel !== undefined ? (
                          <span className="text-emerald-300 font-bold">{dev.batteryLevel}%</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-[10px] text-cyan-300">
                        R:{Math.round(dev.spatialPosition.orbitRadius)} | ({dev.spatialPosition.x.toFixed(1)}, {dev.spatialPosition.y.toFixed(1)}, {dev.spatialPosition.z.toFixed(1)})
                      </td>
                      <td className="p-2.5 text-right">
                        {dev.connectionState === 'connected' ? (
                          <button
                            type="button"
                            onClick={() => {
                              bluetoothDeviceManager.disconnectDevice(dev.id);
                              void refresh('bluetooth');
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 rounded transition cursor-pointer"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              await bluetoothDeviceManager.connectDevice(dev.id);
                              void refresh('bluetooth');
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 rounded transition cursor-pointer"
                          >
                            Connect GATT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <pre className="max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-emerald-200"
          aria-live="polite">{JSON.stringify(live??{source:'not-yet-read',state:'unavailable'},null,2)}</pre>
        )}
      </section>
      {linkNotice&&<p role="status" className="mt-3 break-all text-xs text-cyan-300">{linkNotice}</p>}
      <p className="mt-3 text-[11px] text-slate-500">
        Each panel is its own browser route and preserves the background canvas and
        HyperTerminal state. Signed-in cross-device account synchronization requires a separately
        verified identity provider and authenticated backend storage.
      </p>
    </div>
  </div>
 </aside>;
}
