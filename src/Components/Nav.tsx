import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import HashmarkABI from "../abi/Hashmark.json";
import { uploadVideo } from "../api";

/* ── Types ── */
type Tab        = "record" | "verify";
type RecordStep = "idle" | "recording" | "preview" | "signing" | "processing" | "success" | "error";
type VerifyStep = "idle" | "hashing" | "verified" | "not_found" | "error";

/* ── Helpers ── */
async function sha256(blob: Blob): Promise<string> {
  const buf  = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
}
const short = (h: string) => h ? h.slice(0,10)+"…"+h.slice(-8) : "—";
const fmt   = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtTs = (ts: number) => ts ? new Date(ts * 1000).toISOString().slice(0,19).replace("T"," ") + " UTC" : "—";

function chainName(id: number): string {
  const names: Record<number,string> = {1:"Ethereum Mainnet",11155111:"Sepolia Testnet",137:"Polygon",80001:"Mumbai",1337:"Localhost Anvil",31337:"Hardhat"};
  return names[id] || `Chain ${id}`;
}

const _raw_contract = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const CONTRACT_ADDRESS = (_raw_contract.match(/0x[0-9a-fA-F]{40}/) || [""])[0];

/* ── Real QR Code (from backend) ── */
function QRImg({ hash, target = "verify" }: { hash: string; target?: "verify" | "watch" }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!hash) return;
    const query = target === "verify" ? "" : `?target=${encodeURIComponent(target)}`;
    fetch(`/api/qr/${encodeURIComponent(hash)}${query}`)
      .then(r => r.json())
      .then(d => { if (d.qrDataUrl) setSrc(d.qrDataUrl); })
      .catch(() => {});
  }, [hash, target]);
  return (
    <div style={{width:"min(180px,40vw)",height:"min(180px,40vw)",borderRadius:16,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
      {src
        ? <img src={src} alt="QR Code" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
        : <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#999",letterSpacing:"0.1em"}}>Loading QR…</span>
      }
    </div>
  );
}

/* ── Button ── */
function Btn({children,onClick,disabled=false,gold=false,outline=false,red=false,style={},full=false}:{
  children:React.ReactNode;onClick?:()=>void;disabled?:boolean;
  gold?:boolean;outline?:boolean;red?:boolean;style?:React.CSSProperties;full?:boolean;
}) {
  const [hov,setHov]=useState(false);
  const base:React.CSSProperties={
    position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
    gap:8,padding:"11px 22px",borderRadius:12,border:"none",cursor:disabled?"not-allowed":"pointer",
    fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",
    transition:"all 0.25s ease",overflow:"hidden",opacity:disabled?0.35:1,
    width:full?"100%":"auto",
    ...(style && !("flex" in style) ? {flexShrink:0} : {}),
    ...style,
  };
  let specific:React.CSSProperties={};
  if(gold&&!outline) specific={background:hov?"#e2bc52":"#D4A843",color:"#000",boxShadow:hov?"0 0 32px rgba(212,168,67,0.6)":"none"};
  if(red&&!outline)  specific={background:hov?"#e86060":"#e05252",color:"#fff",boxShadow:hov?"0 0 28px rgba(224,82,82,0.55)":"none"};
  if(outline&&gold)  specific={background:hov?"rgba(212,168,67,0.1)":"transparent",color:"#D4A843",border:"1px solid rgba(212,168,67,0.4)"};
  if(outline&&!gold&&!red) specific={background:hov?"rgba(255,255,255,0.06)":"transparent",color:hov?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.15)"};
  return(
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...base,...specific}}>
      {children}
    </button>
  );
}

/* ── Row ── */
function Row({label,value,color="#ccc"}:{label:string;value:string;color?:string}) {
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.45)",letterSpacing:"0.14em",textTransform:"uppercase",flexShrink:0,lineHeight:1.6}}>{label}</span>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color,textAlign:"right",wordBreak:"break-all",lineHeight:1.6}}>{value}</span>
    </div>
  );
}

/* ── Glass box ── */
function Glass({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties}) {
  return(
    <div style={{borderRadius:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)",...style}}>
      {children}
    </div>
  );
}

/* ── Wallet Connect Banner ── */
function WalletBanner({ wallet, chainId, connecting, installed, onConnect }:{
  wallet: string|null; chainId: number|null; connecting: boolean;
  installed: boolean; onConnect: ()=>void;
}) {
  if (wallet) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:10,background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.22)",marginBottom:16,flexShrink:0}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#34d399",flexShrink:0}}/>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34d399",letterSpacing:"0.1em",flex:1}}>{short(wallet)}</span>
        {chainId && <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(52,211,153,0.55)",letterSpacing:"0.08em"}}>{chainName(chainId)}</span>}
      </div>
    );
  }
  return (
    <div style={{marginBottom:16,flexShrink:0}}>
      {!installed
        ? <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",fontFamily:"'DM Mono',monospace",fontSize:10,color:"#f87171",letterSpacing:"0.08em"}}>
            MetaMask not detected. <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{color:"#D4A843"}}>Install MetaMask</a> to authenticate.
          </div>
        : <Btn gold onClick={onConnect} disabled={connecting} full style={{gap:10}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0}}><path d="M21 2H3l7 9.46V19l4 2v-9.54L21 2z"/></svg>
            {connecting ? "Connecting…" : "Connect MetaMask to Sign"}
          </Btn>
      }
    </div>
  );
}

/* ════════════════════════════════ RECORD TAB ════════════════════════════════ */
function RecordTab({ wallet, signer, chainId, connecting, installed, onConnect }:{
  wallet: string|null; signer: ethers.JsonRpcSigner|null; chainId: number|null;
  connecting: boolean; installed: boolean; onConnect: ()=>void;
}) {
  const [step,setStep]         = useState<RecordStep>("idle");
  const [elapsed,setElapsed]   = useState(0);
  const [videoURL,setVideoURL] = useState<string|null>(null);
  const [hash,setHash]         = useState<string|null>(null);
  const [txHash,setTxHash]     = useState<string|null>(null);
  const [progress,setProgress] = useState(0);
  const [txBlock,setTxBlock]   = useState<number|null>(null);
  const [txTs,setTxTs]         = useState<number|null>(null);
  const [txNet,setTxNet]       = useState("");
  const [signErr,setSignErr]   = useState("");
  const [uploading,setUploading] = useState(false);
  const [uploadErr,setUploadErr] = useState("");
  const [videoStored,setVideoStored] = useState(false);

  const liveRef   = useRef<HTMLVideoElement>(null);
  const mrRef     = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const streamRef = useRef<MediaStream|null>(null);

  useEffect(()=>{
    navigator.mediaDevices.getUserMedia({video:true,audio:true})
      .then(s=>{streamRef.current=s;if(liveRef.current){liveRef.current.srcObject=s;liveRef.current.play();}})
      .catch(()=>{});
    return()=>{streamRef.current?.getTracks().forEach(t=>t.stop());clearInterval(timerRef.current!);};
  },[]);

  const startRec=()=>{
    if(!streamRef.current)return;
    chunksRef.current=[];
    const mr=new MediaRecorder(streamRef.current,{mimeType:"video/webm;codecs=vp8,opus"});
    mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
    mr.onstop=async()=>{
      const blob=new Blob(chunksRef.current,{type:"video/webm"});
      const computedHash = await sha256(blob);
      setVideoURL(URL.createObjectURL(blob));
      setHash(computedHash);
      setStep("preview");
      setUploadErr("");
      setVideoStored(false);
      setUploading(true);
      try {
        const file = new File([blob], `hashmark_${Date.now()}.webm`, { type: blob.type || "video/webm" });
        await uploadVideo(file, computedHash);
        setVideoStored(true);
      } catch (err: unknown) {
        const msg = (err as { message?: string }).message || "Video upload failed.";
        setUploadErr(msg);
      } finally {
        setUploading(false);
      }
    };
    mr.start();mrRef.current=mr;
    setElapsed(0);timerRef.current=setInterval(()=>setElapsed(s=>s+1),1000);setStep("recording");
  };
  const stopRec=()=>{mrRef.current?.stop();clearInterval(timerRef.current!);};
  const download=()=>{
    if(!videoURL)return;
    const a=document.createElement("a");
    a.href=videoURL;
    a.download=`hashmark_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const reset=()=>{setStep("idle");setVideoURL(null);setHash(null);setTxHash(null);setSignErr("");setProgress(0);setTxBlock(null);setTxTs(null);setTxNet("");setUploading(false);setUploadErr("");setVideoStored(false);};

  const sign = async () => {
    if (!signer || !wallet || !hash) return;
    // Resolve contract address: use build-time env first, fall back to backend /api/info
    let contractAddr = CONTRACT_ADDRESS;
    if (!contractAddr) {
      try {
        const info = await fetch("/api/info").then(r => r.json());
        const m = (info.contractAddress || "").match(/0x[0-9a-fA-F]{40}/);
        contractAddr = m ? m[0] : "";
      } catch { /* ignore */ }
    }
    if (!contractAddr) { setSignErr("CONTRACT_ADDRESS not set. Deploy the contract first."); setStep("error"); return; }
    setSignErr("");setStep("processing");setProgress(0);

    // Animate progress while waiting for MetaMask + block confirmation
    const iv = setInterval(()=>setProgress(p=>p<82?p+0.6:p),60);
    try {
      const contract = new ethers.Contract(contractAddr, HashmarkABI, signer);
      const tx = await contract.authenticateVideo(hash);
      setProgress(88);
      const receipt = await tx.wait();
      clearInterval(iv);
      setProgress(100);
      setTxHash(receipt.hash);
      // Fetch real block timestamp
      const provider = signer.provider!;
      const block = await provider.getBlock(receipt.blockNumber);
      setTxBlock(receipt.blockNumber);
      setTxTs(block ? Number(block.timestamp) : Math.floor(Date.now()/1000));
      const network = await provider.getNetwork();
      setTxNet(chainName(Number(network.chainId)));
      setStep("success");
    } catch (err: unknown) {
      clearInterval(iv);
      setProgress(0);
      const raw = (err as {reason?:string;message?:string}).reason || (err as {message?:string}).message || "Transaction failed";
      let msg = raw;
      if (raw.includes("Failed to fetch") || raw.includes("could not coalesce") || raw.includes("UNKNOWN_ERROR")) {
        msg = "Cannot reach the blockchain RPC. Please switch your wallet to a supported network (e.g. Sepolia or Ethereum Mainnet).";
      } else if (raw.includes("already authenticated")) {
        msg = "This video is already authenticated on-chain.";
      }
      setSignErr(msg);
      setStep("error");
    }
  };

  const descriptions:Record<RecordStep,string>={
    idle:      "Point your camera and press Start — every frame will be cryptographically fingerprinted.",
    recording: "Recording in progress. Press Stop when done.",
    preview:   "Review your clip, then authenticate it on-chain with MetaMask.",
    signing:   "Connect MetaMask and sign the transaction to seal this video on the blockchain.",
    processing:"Broadcasting your video's SHA-256 fingerprint to the blockchain…",
    success:   "Authenticated. Your video is permanently sealed on the immutable ledger.",
    error:     "Authentication failed.",
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18,height:"100%"}}>
      <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.05em",lineHeight:1.7,flexShrink:0}}>
        {descriptions[step]}
      </p>

      {/* IDLE / RECORDING */}
      {(step==="idle"||step==="recording")&&(
        <div style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0}}>
          <div style={{
            position:"relative",flex:1,minHeight:220,borderRadius:18,overflow:"hidden",
            boxShadow:step==="recording"?"0 0 50px rgba(239,68,68,0.2)":"none",
            border:step==="recording"?"2px solid rgba(239,68,68,0.6)":"1px solid rgba(212,168,67,0.25)",
            transition:"all 0.5s ease",
          }}>
            <video ref={liveRef} muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block",transform:"scaleX(-1)"}}/>
            <div style={{position:"absolute",inset:0,zIndex:-1,display:"flex",alignItems:"center",justifyContent:"center",background:"#080814"}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.18)",letterSpacing:"0.2em",textTransform:"uppercase"}}>Awaiting Camera</span>
            </div>
            {step==="recording"&&(
              <>
                <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(to bottom,rgba(239,68,68,0.07) 0%,transparent 30%,transparent 70%,rgba(239,68,68,0.07) 100%)"}}/>
                <div style={{position:"absolute",left:0,right:0,height:2,pointerEvents:"none",background:"linear-gradient(90deg,transparent,rgba(239,68,68,0.95),transparent)",boxShadow:"0 0 20px rgba(239,68,68,1)",animation:"scanBeam 2.2s linear infinite"}}/>
              </>
            )}
            {(["tl","tr","bl","br"] as const).map(p=>(
              <div key={p} style={{
                position:"absolute",width:20,height:20,pointerEvents:"none",
                ...(p.includes("t")?{top:12}:{bottom:12}),
                ...(p.includes("l")?{left:12}:{right:12}),
                borderTop:   p.includes("t")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderBottom:p.includes("b")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderLeft:  p.includes("l")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderRight: p.includes("r")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
              }}/>
            ))}
            {step==="recording"&&(
              <div style={{position:"absolute",top:12,left:12,display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:99,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(239,68,68,0.45)"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"blink 1s ease-in-out infinite"}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#fff",letterSpacing:"0.1em",fontWeight:500}}>REC {fmt(elapsed)}</span>
              </div>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"center",flexShrink:0}}>
            {step==="idle"&&(
              <Btn red onClick={startRec} style={{padding:"12px 32px",gap:10,width:"100%",maxWidth:280}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:"rgba(0,0,0,0.3)",display:"inline-block",flexShrink:0}}/>
                Start Recording
              </Btn>
            )}
            {step==="recording"&&(
              <Btn outline onClick={stopRec} style={{padding:"12px 32px",gap:10,borderColor:"rgba(239,68,68,0.45)",color:"#f87171",width:"100%",maxWidth:280}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop Recording
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {step==="preview"&&videoURL&&(
        <div style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,animation:"fadeUp 0.5s ease both"}}>
          <div style={{position:"relative",flex:1,minHeight:180,borderRadius:18,overflow:"hidden",border:"1px solid rgba(52,211,153,0.35)"}}>
            <video src={videoURL} controls style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",top:12,right:12,padding:"4px 12px",borderRadius:99,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(52,211,153,0.45)"}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34d399",letterSpacing:"0.12em",fontWeight:500}}>✓ CAPTURED</span>
            </div>
          </div>
          <Glass style={{padding:16}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(52,211,153,0.7)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>SHA-256 Fingerprint</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)",wordBreak:"break-all",lineHeight:1.7}}>{hash}</div>
          </Glass>
          <WalletBanner wallet={wallet} chainId={chainId} connecting={connecting} installed={installed} onConnect={onConnect}/>
          <div style={{display:"flex",gap:12,flexShrink:0}}>
            <Btn outline onClick={reset} style={{flex:1}}>Re-record</Btn>
            <Btn gold onClick={sign} disabled={!wallet||!signer} style={{flex:2,gap:10}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {wallet ? "Sign & Authenticate" : "Connect Wallet First"}
            </Btn>
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {step==="processing"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:28,animation:"fadeUp 0.5s ease both"}}>
          <div style={{position:"relative",width:112,height:112}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{
                position:"absolute",inset:i*14,borderRadius:"50%",border:"2px solid",
                borderColor:`rgba(${["212,168,67","74,158,219","155,89,232"][i]},0.15)`,
                borderTopColor:`rgba(${["212,168,67","74,158,219","155,89,232"][i]},1)`,
                animation:`spin ${1+i*0.45}s linear infinite`,
              }}/>
            ))}
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"#D4A843"}}>
              {Math.round(progress)}%
            </div>
          </div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:300,color:"#fff"}}>Anchoring to Ledger</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em"}}>
              {progress<30?"Waiting for MetaMask confirmation…":progress<60?"Broadcasting to blockchain nodes…":progress<88?"Waiting for block confirmation…":"Sealing immutable record…"}
            </div>
          </div>
          <div style={{width:"100%",height:3,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#D4A843,#9B59E8)",boxShadow:"0 0 14px rgba(212,168,67,0.7)",transition:"width 0.1s linear",borderRadius:4}}/>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {step==="success"&&txHash&&hash&&(
        <div style={{display:"flex",flexDirection:"column",gap:18,flex:1,overflowY:"auto",animation:"fadeUp 0.6s ease both"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,padding:16,borderRadius:18,background:"rgba(52,211,153,0.08)",border:"1.5px solid rgba(52,211,153,0.3)",boxShadow:"0 0 36px rgba(52,211,153,0.1)"}}>
            <div style={{width:48,height:48,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:"rgba(52,211,153,0.15)",border:"2px solid rgba(52,211,153,0.5)",boxShadow:"0 0 24px rgba(52,211,153,0.35)",animation:"popIn 0.5s cubic-bezier(0.4,0,0.2,1) both"}}>✓</div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:300,color:"#34d399",marginBottom:4}}>Successfully Authenticated</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(52,211,153,0.55)",letterSpacing:"0.1em"}}>Permanently sealed on-chain</div>
            </div>
          </div>
          <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
              {videoStored ? (
                <QRImg hash={hash} target="watch"/>
              ) : (
                <div style={{width:"min(180px,40vw)",height:"min(180px,40vw)",borderRadius:16,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",textAlign:"center",padding:12}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
                    {uploading ? "Uploading video for playback…" : "Video not stored yet"}
                  </span>
                </div>
              )}
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.14em",textTransform:"uppercase"}}>
                {videoStored ? "Scan to watch" : "QR pending"}
              </span>
              {uploadErr && (
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(248,113,113,0.7)",letterSpacing:"0.08em",textAlign:"center",maxWidth:180}}>
                  Upload failed: {uploadErr}
                </span>
              )}
            </div>
            <Glass style={{flex:1,minWidth:180,padding:16}}>
              <Row label="TX Hash"    value={short(txHash)}                         color="#4A9EDB"/>
              <Row label="Video Hash" value={short(hash)}                           color="#D4A843"/>
              <Row label="Wallet"     value={short(wallet||"")}                     color="#9B59E8"/>
              <Row label="Network"    value={txNet||chainName(chainId||0)}          color="#34d399"/>
              <Row label="Block"      value={txBlock ? `#${txBlock.toLocaleString()}` : "—"}  color="rgba(255,255,255,0.6)"/>
              <Row label="Timestamp"  value={fmtTs(txTs||0)}                       color="rgba(255,255,255,0.6)"/>
              <Row label="Status"     value="Immutable ✓"                          color="#34d399"/>
            </Glass>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",flexShrink:0}}>
            <Btn gold onClick={download} style={{flex:1,minWidth:110,gap:8}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Video
            </Btn>
            <Btn gold outline onClick={()=>{
              if(!txHash||!hash||!wallet)return;
              const data={txHash,videoHash:hash,creator:wallet,block:txBlock,timestamp:fmtTs(txTs||0),network:txNet||chainName(chainId||0)};
              const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
              const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`hashmark_cert_${hash.slice(0,8)}.json`;a.click();
            }} style={{flex:1,minWidth:120,gap:8}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Certificate
            </Btn>
            <Btn outline onClick={reset} style={{flex:1,minWidth:90}}>New</Btn>
          </div>
        </div>
      )}

      {/* ERROR */}
      {step==="error"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,animation:"fadeUp 0.5s ease both",padding:"0 8px"}}>
          <div style={{width:56,height:56,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,background:"rgba(219,74,74,0.1)",border:"2px solid rgba(219,74,74,0.45)"}}>✕</div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,color:"#f87171"}}>Transaction Failed</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(248,113,113,0.7)",letterSpacing:"0.06em",lineHeight:1.7,maxWidth:280}}>{signErr}</div>
          </div>
          <Btn outline onClick={()=>setStep("preview")}>Back to Preview</Btn>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════ VERIFY TAB ════════════════════════════════ */
interface VerifyResult { creator: string; timestamp: number; hash: string; }

function VerifyTab() {
  const [step,setStep]       = useState<VerifyStep>("idle");
  const [drag,setDrag]       = useState(false);
  const [fileName,setFileName] = useState<string|null>(null);
  const [hash,setHash]       = useState<string|null>(null);
  const [videoURL,setVideoURL] = useState<string|null>(null);
  const [result,setResult]   = useState<VerifyResult|null>(null);
  const [errMsg,setErrMsg]   = useState("");
  const inputRef             = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setFileName(file.name);
    setVideoURL(URL.createObjectURL(file));
    setResult(null);
    setErrMsg("");
    setStep("hashing");

    try {
      const h = await sha256(file);
      setHash(h);

      // Query the blockchain via backend
      const res  = await fetch(`/api/verify/${encodeURIComponent(h)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Server error");

      if (data.authenticated) {
        setResult({ creator: data.creator, timestamp: data.timestamp, hash: h });
        setStep("verified");
      } else {
        setStep("not_found");
      }
    } catch (e: unknown) {
      setErrMsg((e as {message?:string}).message || "Verification failed");
      setStep("error");
    }
  };

  const reset = () => { setStep("idle"); setHash(null); setFileName(null); setVideoURL(null); setResult(null); setErrMsg(""); };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18,flex:1,minHeight:0}}>

      {/* DROP ZONE */}
      {step==="idle"&&(
        <div
          onDragOver={e=>{e.preventDefault();setDrag(true);}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)processFile(f);}}
          onClick={()=>inputRef.current?.click()}
          style={{
            flex:1,minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:24,borderRadius:18,cursor:"pointer",transition:"all 0.3s ease",
            border:drag?"2px dashed #D4A843":"2px dashed rgba(255,255,255,0.1)",
            background:drag?"rgba(212,168,67,0.06)":"transparent",
            boxShadow:drag?"0 0 40px rgba(212,168,67,0.18)":"none",
            transform:drag?"scale(1.01)":"scale(1)",
            animation:"fadeUp 0.5s ease both",
          }}>
          <input ref={inputRef} type="file" accept="video/*" style={{display:"none"}}
            onChange={e=>{const f=e.target.files?.[0];if(f)processFile(f);}}/>
          <div style={{
            width:80,height:80,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:32,transition:"all 0.3s ease",
            background:drag?"rgba(212,168,67,0.2)":"rgba(255,255,255,0.04)",
            border:drag?"2px solid rgba(212,168,67,0.55)":"1px solid rgba(255,255,255,0.1)",
            boxShadow:drag?"0 0 44px rgba(212,168,67,0.45)":"none",
            animation:drag?"none":"breathe 4s ease-in-out infinite",
          }}>🎬</div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:8,padding:"0 16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:300,color:"#fff"}}>Drop your video to verify</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"0.16em"}}>OR CLICK TO BROWSE — MP4, WEBM, MOV</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",justifyContent:"center",padding:"0 16px"}}>
            {["SHA-256 Hashed","Blockchain Verified","Tamper-Proof"].map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(212,168,67,0.65)"}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.38)",letterSpacing:"0.1em",textTransform:"uppercase"}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HASHING */}
      {step==="hashing"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28,animation:"fadeUp 0.5s ease both"}}>
          <div style={{position:"relative",width:96,height:96}}>
            {[0,1].map(i=>(
              <div key={i} style={{
                position:"absolute",inset:i*16,borderRadius:"50%",border:"2px solid",
                borderColor:`rgba(${["212,168,67","155,89,232"][i]},0.15)`,
                borderTopColor:`rgba(${["212,168,67","155,89,232"][i]},1)`,
                animation:`spin ${1+i*0.55}s linear infinite`,
              }}/>
            ))}
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🔍</div>
          </div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:300,color:"#fff"}}>Analysing Video</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em"}}>Computing SHA-256 · Querying blockchain…</div>
          </div>
          {hash&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.2)",maxWidth:300,textAlign:"center",wordBreak:"break-all",lineHeight:1.7,padding:"0 16px"}}>{hash}</div>}
        </div>
      )}

      {/* VERIFIED */}
      {step==="verified"&&hash&&result&&(
        <div style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,overflowY:"auto",animation:"fadeUp 0.5s ease both"}}>
          {videoURL&&(
            <div style={{borderRadius:18,overflow:"hidden",border:"1px solid rgba(52,211,153,0.35)",flexShrink:0,maxHeight:190}}>
              <video src={videoURL} controls style={{width:"100%",display:"block",objectFit:"cover"}}/>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:16,padding:16,borderRadius:18,background:"rgba(52,211,153,0.07)",border:"1.5px solid rgba(52,211,153,0.28)",boxShadow:"0 0 30px rgba(52,211,153,0.09)"}}>
            <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:"rgba(52,211,153,0.13)",border:"2px solid rgba(52,211,153,0.45)",animation:"popIn 0.4s cubic-bezier(0.4,0,0.2,1) both"}}>✓</div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,fontWeight:300,color:"#34d399",marginBottom:4}}>Authenticity Verified</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(52,211,153,0.55)",letterSpacing:"0.08em"}}>{fileName} — found on blockchain</div>
            </div>
          </div>
          <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
              <QRImg hash={hash}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Scan to share</span>
            </div>
            <Glass style={{flex:1,minWidth:160,padding:16}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:12,fontWeight:500}}>Blockchain Record</div>
              <Row label="SHA-256"     value={short(hash)}                      color="#D4A843"/>
              <Row label="Authenticated By" value={short(result.creator)}       color="#9B59E8"/>
              <Row label="Timestamp"   value={fmtTs(result.timestamp)}          color="rgba(255,255,255,0.6)"/>
              <Row label="Status"      value="Authentic ✓"                     color="#34d399"/>
            </Glass>
          </div>
          <Btn outline onClick={reset} full>Verify Another</Btn>
        </div>
      )}

      {/* NOT FOUND */}
      {step==="not_found"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,animation:"fadeUp 0.5s ease both"}}>
          <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,background:"rgba(219,74,74,0.1)",border:"2px solid rgba(219,74,74,0.45)",boxShadow:"0 0 32px rgba(219,74,74,0.2)"}}>✕</div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:8,padding:"0 16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,color:"#f87171"}}>Not Found on Chain</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.45)",letterSpacing:"0.06em",maxWidth:280,lineHeight:1.7}}>
              This video has no authentication record on the blockchain. It may be unregistered or tampered.
            </div>
          </div>
          {hash&&(
            <Glass style={{width:"100%",padding:16}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(248,113,113,0.55)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>Computed Hash</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.38)",wordBreak:"break-all",lineHeight:1.7}}>{hash}</div>
            </Glass>
          )}
          <Btn red onClick={reset}>Try Another Video</Btn>
        </div>
      )}

      {/* ERROR */}
      {step==="error"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,animation:"fadeUp 0.5s ease both"}}>
          <div style={{width:56,height:56,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,background:"rgba(219,74,74,0.1)",border:"2px solid rgba(219,74,74,0.45)"}}>!</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,color:"#f87171",marginBottom:8}}>Verification Error</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(248,113,113,0.6)",lineHeight:1.7,maxWidth:280}}>{errMsg || "Could not reach the backend. Ensure it is running on port 4000."}</div>
          </div>
          <Btn outline onClick={reset}>Try Again</Btn>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════ ROOT ════════════════════════════════ */

// Pick MetaMask provider from window.ethereum — handles multi-wallet conflicts
function getMetaMaskProvider(): ethers.Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = window.ethereum as (ethers.Eip1193Provider & {
    isMetaMask?: boolean;
    providers?: (ethers.Eip1193Provider & { isMetaMask?: boolean })[];
  }) | undefined;
  if (!eth) return null;
  // EIP-6963 / MetaMask multi-wallet: pick MetaMask specifically
  if (eth.providers?.length) {
    const mm = eth.providers.find(p => p.isMetaMask);
    if (mm) return mm;
  }
  return eth;
}

export default function HashmarkApp() {
  const [tab,setTab]           = useState<Tab>("record");
  const [wallet,setWallet]     = useState<string|null>(null);
  const [signer,setSigner]     = useState<ethers.JsonRpcSigner|null>(null);
  const [chainId,setChainId]   = useState<number|null>(null);
  const [connecting,setConn]   = useState(false);
  const [isMobile,setIsMobile] = useState(()=>window.innerWidth<=640);
  const installed               = !!getMetaMaskProvider();

  useEffect(()=>{
    const onResize=()=>setIsMobile(window.innerWidth<=640);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  // Auto-reconnect if already approved
  useEffect(()=>{
    const eip = getMetaMaskProvider();
    if (!eip) return;
    const eth = eip as { request:(a:{method:string;params?:unknown[]})=>Promise<string[]> };
    eth.request({method:"eth_accounts"})
      .then(async (accounts: string[])=>{
        if (accounts[0]) {
          const provider = new ethers.BrowserProvider(eip);
          const s = await provider.getSigner();
          const net = await provider.getNetwork();
          setWallet(accounts[0]);
          setSigner(s);
          setChainId(Number(net.chainId));
        }
      }).catch(()=>{});
    // Events always live on window.ethereum (the top-level object), not on a sub-provider
    type EthEvents = { on:(e:string,cb:(...a:unknown[])=>void)=>void; removeListener:(e:string,cb:(...a:unknown[])=>void)=>void };
    const evts = window.ethereum as unknown as EthEvents;
    if (!evts?.on) return;
    const onAccounts = (accs: unknown) => {
      const accounts = accs as string[];
      if (!accounts[0]) { setWallet(null); setSigner(null); setChainId(null); }
      else setWallet(accounts[0]);
    };
    const onChain = (cid: unknown) => setChainId(parseInt(cid as string, 16));
    evts.on("accountsChanged", onAccounts);
    evts.on("chainChanged", onChain);
    return () => { evts.removeListener("accountsChanged", onAccounts); evts.removeListener("chainChanged", onChain); };
  },[]);

  const connectWallet = async () => {
    const eip = getMetaMaskProvider();
    if (!eip) return;
    setConn(true);
    try {
      const eth = eip as { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

      // 1. Request accounts first
      await eth.request({ method: "eth_requestAccounts" });

      // 2. Only switch/add chain when VITE_CHAIN_ID is explicitly configured.
      //    Skipping this on deployments without env vars avoids sending MetaMask
      //    to a local RPC (127.0.0.1:8545) that doesn't exist in production.
      const configuredChainId = import.meta.env.VITE_CHAIN_ID;
      if (configuredChainId) {
        const targetChainId = parseInt(configuredChainId, 10);
        const targetChainHex = "0x" + targetChainId.toString(16);
        const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined;

        try {
          await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: targetChainHex }] });
        } catch (switchErr: unknown) {
          const code = (switchErr as { code?: number }).code;
          // 4902 = chain not added to MetaMask — only add if we have an RPC URL
          if (code === 4902 && rpcUrl) {
            const isLocal = targetChainId === 1337 || targetChainId === 31337;
            await eth.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: targetChainHex,
                chainName: isLocal ? "Hashmark Local (Anvil)" : `Chain ${targetChainId}`,
                rpcUrls: [rpcUrl],
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: null,
              }],
            });
          }
          // If user rejected or no RPC URL, continue with current network
        }
      }

      const provider = new ethers.BrowserProvider(eip);
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      const net = await provider.getNetwork();
      setWallet(addr);
      setSigner(s);
      setChainId(Number(net.chainId));

      // Auto-fund wallet on local networks (Anvil/Hardhat) so transactions don't fail
      const cid = Number(net.chainId);
      if (cid === 1337 || cid === 31337) {
        fetch("/api/faucet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr }),
        }).catch(() => {});
      }
    } catch { /* user rejected */ }
    finally { setConn(false); }
  };

  const BG_VIDEO = "/videos/hashmark-bg.mp4";

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root,#__next{width:100%;height:100%;background:#060610;-webkit-font-smoothing:antialiased;}
        body{overflow:hidden;}
        @media(max-width:640px){body{overflow:auto;}}
        input{font-family:'DM Mono',monospace;}
        input::placeholder{color:rgba(255,255,255,0.22);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.25);border-radius:4px;}
        @keyframes scanBeam{0%{top:0;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:100%;opacity:0}}
        @keyframes blink{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.9)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.55)}to{opacity:1;transform:scale(1)}}
        @keyframes logoIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(28px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* Background video */}
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden"}}>
        <video autoPlay muted loop playsInline src={BG_VIDEO}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.22) saturate(1.4)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(12,8,32,0.75) 0%,transparent 50%,rgba(0,0,0,0.6) 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(6,6,16,0.85) 0%,transparent 50%)"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(212,168,67,0.055) 0%,transparent 55%)"}}/>
      </div>

      {/* Full-screen layout */}
      <div style={{position:"fixed",inset:0,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",overflow:isMobile?"auto":"hidden"}}>

        {/* ── LOGO HEADER ── */}
        <header style={{width:"100%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"12px 16px":"16px 24px",animation:"logoIn 0.8s cubic-bezier(0.4,0,0.2,1) both 0.05s"}}>
          <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12}}>
            <div style={{width:isMobile?30:36,height:isMobile?30:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.22)"}}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <line x1="6"  y1="2"  x2="4"   y2="18" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="13" y1="2"  x2="11"  y2="18" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="2"  y1="7"  x2="18"  y2="7"  stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="1.5"y1="13" x2="17.5"y2="13" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{display:"flex",alignItems:"baseline",gap:isMobile?6:10}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?12:15,letterSpacing:"0.3em",color:"rgba(255,255,255,0.92)",textTransform:"uppercase",lineHeight:1}}>HASHMARK</span>
              {!isMobile&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.16em",color:"#D4A843",padding:"3px 8px",border:"1px solid rgba(212,168,67,0.28)",borderRadius:6,background:"rgba(212,168,67,0.08)",textTransform:"uppercase",lineHeight:1}}>PROTOCOL</span>}
            </div>
          </div>
          {/* Wallet status in header */}
          {wallet
            ? <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:99,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#34d399",flexShrink:0}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399",letterSpacing:"0.14em"}}>{short(wallet)}</span>
              </div>
            : <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:99,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#34d399",flexShrink:0,animation:"blink 2s ease-in-out infinite"}}/>
                {!isMobile&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399",letterSpacing:"0.18em",textTransform:"uppercase"}}>Ledger Live</span>}
              </div>
          }
        </header>

        <div style={{width:"100%",flexShrink:0,padding:"0 24px"}}>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(212,168,67,0.2) 35%,rgba(155,89,232,0.15) 70%,transparent)"}}/>
        </div>

        {/* ── CARD ── */}
        <div style={{flex:1,minHeight:0,width:"100%",display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"center",padding:isMobile?"8px 8px 16px":"16px 16px 20px"}}>
          <div style={{
            width:"100%",maxWidth:520,height:isMobile?"auto":"100%",...(!isMobile&&{maxHeight:760}),
            display:"flex",flexDirection:"column",overflow:"hidden",
            background:"rgba(10,10,22,0.84)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
            border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,
            boxShadow:"0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.06)",
            animation:"cardIn 0.9s cubic-bezier(0.4,0,0.2,1) both 0.15s",position:"relative",
          }}>
            <div style={{position:"absolute",top:0,left:32,right:32,height:1,pointerEvents:"none",background:"linear-gradient(90deg,transparent,rgba(212,168,67,0.35) 40%,rgba(155,89,232,0.22) 70%,transparent)"}}/>

            <div style={{padding:isMobile?"16px 16px 0":"24px 24px 0",flexShrink:0}}>
              {/* Tabs */}
              <div style={{display:"flex",gap:6,padding:6,borderRadius:18,marginBottom:isMobile?12:20,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                {([
                  {id:"record" as Tab,icon:<svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>,label:"Record & Authenticate",labelMobile:"Record"},
                  {id:"verify" as Tab,icon:<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>,label:"Verify Videos",labelMobile:"Verify"},
                ]).map(({id,icon,label,labelMobile})=>{
                  const active=tab===id;
                  return(
                    <button key={id} onClick={()=>setTab(id)} style={{
                      flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      padding:isMobile?"9px 8px":"10px 12px",borderRadius:12,border:"none",cursor:"pointer",transition:"all 0.3s ease",
                      background:active?"rgba(212,168,67,0.12)":"transparent",
                      boxShadow:active?"inset 0 0 0 1px rgba(212,168,67,0.25),0 0 24px rgba(212,168,67,0.1)":"none",
                      color:active?"#D4A843":"rgba(255,255,255,0.38)",
                      fontFamily:"'DM Mono',monospace",fontSize:isMobile?9:10,letterSpacing:"0.14em",textTransform:"uppercase",
                    }}>
                      {icon}{isMobile?labelMobile:label}
                    </button>
                  );
                })}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:isMobile?12:16}}>
                <div style={{width:3,height:20,borderRadius:2,flexShrink:0,background:"linear-gradient(180deg,#D4A843,#9B59E8)"}}/>
                <span style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:isMobile?17:20,fontWeight:300,color:"#fff",lineHeight:1.3}}>
                  {tab==="record"?"Record Authenticated Video":"Verify Video Authenticity"}
                </span>
              </div>
              <div style={{height:1,marginBottom:isMobile?12:20,background:"linear-gradient(90deg,rgba(212,168,67,0.28),transparent)"}}/>
            </div>

            <div style={{flex:1,minHeight:0,padding:isMobile?"0 16px 16px":"0 24px 24px",overflowY:"auto",display:"flex",flexDirection:"column"}}>
              {tab==="record"
                ? <RecordTab wallet={wallet} signer={signer} chainId={chainId} connecting={connecting} installed={installed} onConnect={connectWallet}/>
                : <VerifyTab/>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
