# Client Service Management Platform

A modern web application designed for Client Service Management, featuring a dedicated WebView debugging interface for testing camera and file upload capabilities on mobile devices.

![Platform Preview](https://via.placeholder.com/800x400?text=Client+Service+Platform+Preview)

## 🚀 Features

- **WebView Debugging**: Specialized module to test `capture="environment"` behavior in mobile WebViews.
- **Camera Integration**: Seamlessly triggers native camera or photo gallery on iOS and Android.
- **Responsive Design**: Premium, glassmorphism-inspired UI built with Tailwind CSS.
- **Modern Stack**: Powered by React, TypeScript, and Vite for blazing fast performance.

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with Glassmorphism aesthetic)
- **Deployment**: Ready for static hosting (e.g., Cloudflare Pages, Vercel)

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js > 18.x
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd client-service-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 Mobile Debugging

To test the camera functionality:

1. Connect your mobile device to the same network as your development machine.
2. Find your machine's local IP address (e.g., `192.168.1.x`).
3. Open `http://<YOUR_LOCAL_IP>:5173` in your mobile browser or inside your WebView app.
4. Tap the **Upload / Camera Capture** area.
5. Verify that the **Camera** option appears (due to `capture="environment"`).

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist` directory, ready to be served by any static host.

## 📄 License

MIT
