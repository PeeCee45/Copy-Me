import Image from 'next/image';
import { LINKS } from './links';

const features = [
  { icon: '⚡', title: 'Instant sync', text: 'Copy on one device and paste on another within a second or two.' },
  { icon: '📶', title: 'Over your WiFi', text: 'Your devices talk directly on your own network. Nothing goes through an online server.' },
  { icon: '🔒', title: 'PIN protected', text: 'Only devices that enter your 4-digit PIN can join.' },
  { icon: '🖥️', title: 'Any device', text: 'Windows, Android, and any phone browser. Phones and computers all work together.' },
];

const downloads = [
  { icon: '🪟', title: 'Windows', sub: 'Installer (.exe)', href: LINKS.windows, cta: 'Download for Windows' },
  { icon: '🤖', title: 'Android', sub: 'App (.apk)', href: LINKS.android, cta: 'Download for Android' },
  { icon: '🍎', title: 'macOS and Linux', sub: 'DMG and AppImage', href: LINKS.macLinux, cta: 'See all downloads' },
  { icon: '🌐', title: 'In your browser', sub: 'No install needed', href: LINKS.web, cta: 'Open web version' },
];

const steps = [
  { title: 'Install Copy Me on your computer', text: 'Run the Windows installer and open Copy Me. The window shows an address (like 192.168.1.20:8787) and a 4-digit PIN. If Windows asks about network access, click Allow.' },
  { title: 'Install the Android app', text: 'Download the .apk on your phone and open it. Android will ask you to allow installs from your browser or files app. This is normal for apps outside the Play Store.' },
  { title: 'Put both devices on the same WiFi', text: 'Copy Me works over your local network, so your computer and phone must be connected to the same WiFi.' },
  { title: 'Connect', text: 'In the phone app, enter a device name, the address and the PIN from your computer, then tap Connect. Your phone appears in the list of connected devices.' },
  { title: 'Copy here, paste there', text: 'Copy some text on one device and paste it on the other. Received items also appear in the Activity list, where you can tap one to copy it again.' },
];

const faq = [
  { q: 'Can I connect more than two devices?', a: 'Yes. One computer acts as the host, and any number of phones and other computers can join it. Copies pass between all of them.' },
  { q: 'Can a phone or a second computer join without installing anything?', a: 'A phone can open the host address in its browser (for example http://192.168.1.20:8787), enter its name and the PIN, and send and receive text. A second computer can join using “Option B” in the desktop app.' },
  { q: 'Does it work in the background on my phone?', a: 'Not fully. Android and iOS block background clipboard access, so the phone app syncs while it is open on screen. It reconnects automatically when you come back to it.' },
  { q: 'It says “Could not connect”. What now?', a: 'Check that both devices are on the same WiFi, that the address and PIN match what the computer shows, and that Windows Firewall allows Copy Me.' },
  { q: 'Windows says the app is from an unknown publisher.', a: 'Copy Me is not signed with a paid certificate yet. Click “More info”, then “Run anyway”. On a Mac, right-click the app and choose Open.' },
  { q: 'What can I copy?', a: 'Text for now. Images and files are planned.' },
];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="container nav-in">
          <a href="#top" className="brand">
            <Image src="/logo.png" alt="" width={32} height={32} />
            <span>Copy<b>Me</b></span>
          </a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#download">Download</a>
            <a href="#how">How to use</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero container">
          <div className="hero-text">
            <p className="eyebrow">Clipboard sync for your devices</p>
            <h1>Copy here.<br /><span>Paste there.</span></h1>
            <p className="lead">
              Copy on your computer and paste on your phone, or the other way around. Copy Me syncs your clipboard over your WiFi, with no accounts and no cloud.
            </p>
            <div className="actions">
              <a className="btn" href="#download">Download Copy Me</a>
              <a className="btn ghost" href="#how">How it works</a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="device">
              <small>Laptop</small>
              <p>Meeting moved to 3pm. Room 204.</p>
              <em>Copied</em>
            </div>
            <div className="beam"><span>⇄</span></div>
            <div className="device phone">
              <small>Phone</small>
              <p>Meeting moved to 3pm. Room 204.</p>
              <em className="ok">Ready to paste</em>
            </div>
          </div>
        </section>

        <section id="features" className="container section">
          <h2>Simple, quick and private</h2>
          <div className="grid4">
            {features.map(f => (
              <div className="card" key={f.title}>
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="download" className="container section">
          <h2>Download</h2>
          <p className="sub">Install it on your computer first. That one is the host your other devices connect to.</p>
          <div className="grid4">
            {downloads.map(d => (
              <div className="card dl" key={d.title}>
                <div className="icon">{d.icon}</div>
                <h3>{d.title}</h3>
                <p>{d.sub}</p>
                <a className="btn small" href={d.href} target="_blank" rel="noopener noreferrer">{d.cta}</a>
              </div>
            ))}
          </div>
          <p className="note">iPhone: there is no iOS app yet, but you can use the browser version on any iPhone.</p>
        </section>

        <section id="how" className="container section">
          <h2>How to use Copy Me</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="container section narrow">
          <h2>Questions</h2>
          {faq.map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="footer">
        <div className="container foot-in">
          <div>
            <div className="brand">
              <Image src="/logo.png" alt="" width={28} height={28} />
              <span>Copy<b>Me</b></span>
            </div>
            <p className="small">Built by Promise Ibeh.</p>
          </div>
          <div className="socials">
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="PeeCee45 on GitHub">
              <GitHubIcon /> PeeCee45
            </a>
            <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Promise Ibeh on LinkedIn">
              <span className="in">in</span> Promise Ibeh
            </a>
          </div>
        </div>
        <p className="copy container">© {new Date().getFullYear()} Copy Me. All rights reserved.</p>
      </footer>
    </>
  );
}
