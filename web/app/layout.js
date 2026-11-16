import './globals.css';

export const metadata = {
  title: 'Copy Me: copy here, paste there',
  description:
    'Copy on one device and paste on another. Copy Me syncs your clipboard between your computer and phone over WiFi.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
