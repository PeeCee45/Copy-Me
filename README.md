# Copy Me

**Copy Me** is an open-source clipboard synchronization tool that lets you share clipboard content between your computer and phone over a local Wi-Fi network.

Connect your devices using an IP address and a 4-digit PIN. No complicated setup required.

## Applications

Copy Me currently consists of three applications:

| Application | Technology | Directory |
|---|---|---|
| Web | Web application | `web/` |
| Mobile | React Native / Expo | `mobile/` |
| Desktop | Electron | `desktop/` |

## Getting Started

Clone the repository:

```bash
git clone https://github.com/PeeCee45/copy-me.git
cd copy-me
```

### Desktop

```bash
cd desktop
npm install
npm start
```

The desktop application displays an IP address, port, and 4-digit PIN for connecting other devices.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Open the application on your phone using Expo Go, enter the desktop address and PIN, then tap **Connect**.

### Web

```bash
cd web
npm install
npm run dev
```

Open the local development URL displayed in your terminal.

## Requirements

- Node.js and npm
- Expo Go for mobile development
- A computer and phone connected to the same Wi-Fi network

## How It Works

1. Start Copy Me on your desktop.
2. Get the displayed IP address and 4-digit PIN.
3. Open Copy Me on your mobile device or web application.
4. Enter the connection details.
5. Tap **Connect** to synchronize your clipboard.

Both devices must be connected to the same local Wi-Fi network.

## Contributing

Contributions, bug reports, feature requests, and suggestions are welcome.

Feel free to open an issue or submit a pull request.

## Author

**Promise Ibeh** ([@PeeCee45](https://github.com/PeeCee45))

GitHub: https://github.com/PeeCee45

## License

See [LICENSE](LICENSE) for licensing information.