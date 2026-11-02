#!/usr/bin/env python3
"""Read-only Apple sparsebundle metadata and band inventory. Never mounts or repairs data."""
import argparse, hashlib, json, math, plistlib, sys
from pathlib import Path
from datetime import datetime, timezone

def audit(root: Path, do_hash: bool = False):
    if root.is_symlink() or not root.is_dir():
        raise ValueError('Archive root must be an existing non-symlink directory')
    plist_path = root/'Info.plist'
    band_dir = root/'bands'
    if not plist_path.is_file() or not band_dir.is_dir():
        raise ValueError(f'Expected Info.plist and bands/ in {root}')
    info = plistlib.loads(plist_path.read_bytes())
    if info.get('diskimage-bundle-type') != 'com.apple.diskimage.sparsebundle':
        raise ValueError('Unexpected disk image format')
    band_size = int(info['band-size']); virtual_bytes = int(info['size'])
    if band_size <= 0 or virtual_bytes <= 0: raise ValueError('Invalid sizes')
    maximum = math.ceil(virtual_bytes / band_size)
    bands, anomalies, seen = [], [], set()
    for f in sorted(band_dir.iterdir(), key=lambda f:f.name):
        if f.is_symlink() or not f.is_file():
            anomalies.append(f'{f.name}: not a regular file'); continue
        try:
            if not f.name or any(c not in '0123456789abcdefABCDEF' for c in f.name):
                raise ValueError('not a hex band name')
            pos = int(f.name,16)
        except ValueError:
            anomalies.append(f'{f.name}: not a hex band name'); continue
        st=f.stat()
        if pos in seen: anomalies.append(f'{f.name}: duplicate numeric band index')
        seen.add(pos)
        if pos >= maximum: anomalies.append(f'{f.name}: band index outside declared virtual disk')
        if st.st_size > band_size: anomalies.append(f'{f.name}: exceeds declared band size')
        if st.st_size == 0: anomalies.append(f'{f.name}: zero-length band; inspect before interpreting')
        row={'band':f.name,'index':pos,'bytes':st.st_size}
        if do_hash:
            h=hashlib.sha256()
            with f.open('rb') as fp:
                for chunk in iter(lambda:fp.read(1<<20),b''): h.update(chunk)
            row['sha256']=h.hexdigest()
        bands.append(row)
    # Sparse holes may be expected; absent indices alone are not evidence of data loss.
    return {'schema':'gaia.sparsebundle.audit.v1', 'observed_at_utc':datetime.now(timezone.utc).isoformat(),
            'source_path':str(root), 'format':info.get('diskimage-bundle-type'),
            'band_size':band_size,'virtual_bytes':virtual_bytes,'max_band_slots':maximum,
            'stored_bands':len(bands),'stored_bytes':sum(b['bytes'] for b in bands),
            'anomalies':anomalies,'band_metadata':bands,
            'caveat':'Metadata audit only; no APFS/HFS contents, encryption or filesystem integrity verified.'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('path',type=Path,help='Local/read-only FUSE path to NAME.sparsebundle')
    p.add_argument('--hash',action='store_true',help='Hash every band (potentially gigabytes of reads)')
    p.add_argument('--output',type=Path,help='Write JSON report to a local separate path')
    args=p.parse_args()
    try:
        report=audit(args.path,args.hash)
        val=json.dumps(report,indent=2,ensure_ascii=False)+'\n'
        if args.output:
            if args.output.resolve().is_relative_to(args.path.resolve()):
                raise ValueError('Refusing to write report inside source archive')
            args.output.parent.mkdir(parents=True,exist_ok=True)
            args.output.write_text(val,encoding='utf-8')
        print(json.dumps({k:v for k,v in report.items() if k!='band_metadata'},indent=2))
        if report['anomalies']: print(f'[WARN] {len(report["anomalies"])} anomaly flag(s); not proof of damage',file=sys.stderr)
        return 0
    except Exception as e:
        print('[ERROR] '+str(e),file=sys.stderr); return 1
if __name__=='__main__': sys.exit(main())
