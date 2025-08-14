# 📺 CastGrid - Digital Signage System

A professional digital signage solution combining Android TV apps with a web-based admin dashboard. Deploy to Netlify for instant global access to your content management system.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/castgrid)

## 🚀 **Quick Start (5 minutes)**

### **1. Deploy to Netlify**
1. **Fork this repository** to your GitHub account
2. **Click "Deploy to Netlify"** button above
3. **Connect your GitHub repo** to Netlify
4. **Get live URL** instantly!

### **2. Configure Firebase**
1. **Create Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Firestore** and **Storage** services
3. **Upload config** to your live dashboard
4. **Start managing content!**

## 🌟 **Features**

### **📱 Android TV App**
- **Jetpack Compose** UI for modern Android TV
- **Firebase integration** for real-time content sync
- **Grid-based layouts** (2x2, 3x3, 4x4)
- **Media playback** (video + image support)
- **Unique device identification** for multi-TV setups

### **🌐 Web Admin Dashboard**
- **Responsive design** - works on any device
- **Drag & drop** media management
- **Real-time grid designer** for TV layouts
- **Media library** with preview capabilities
- **Device management** for multiple displays

### **⚡ Backend**
- **Firebase Firestore** for real-time data
- **Firebase Storage** for media files
- **Automatic sync** between web and TV apps
- **Scalable architecture** for enterprise use

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Admin    │    │   Firebase      │    │  Android TV     │
│   Dashboard    │◄──►│   Backend       │◄──►│     Apps        │
│                │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 **Project Structure**

```
CastGrid/
├── app/                          # Android TV application
│   ├── src/main/
│   │   ├── java/com/example/castgrid/
│   │   │   ├── data/            # Data models & Firebase
│   │   │   ├── ui/              # Jetpack Compose UI
│   │   │   ├── di/              # Dependency injection
│   │   │   └── util/            # Utilities
│   │   └── res/                 # Resources
│   └── build.gradle.kts         # Build configuration
├── web-admin/                    # Web dashboard
│   ├── index.html               # Main dashboard
│   ├── admin.css                # Styling
│   ├── admin.js                 # Functionality
│   └── netlify.toml            # Netlify config
├── docs/                        # Documentation
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 🚀 **Deployment Options**

### **Option 1: GitHub + Netlify (Recommended)**
- **Professional appearance** with version control
- **Auto-deploy** on every commit
- **Team collaboration** with pull requests
- **Free hosting** with Netlify

### **Option 2: Direct Netlify Upload**
- **Quick setup** - drag & drop deployment
- **No Git knowledge required**
- **Instant deployment**

## 📋 **Setup Instructions**

### **For Developers**
1. **Clone repository**
   ```bash
   git clone https://github.com/your-username/castgrid.git
   cd castgrid
   ```

2. **Open in Android Studio**
   - Open `app/` folder in Android Studio
   - Sync Gradle files
   - Build project

3. **Configure Firebase**
   - Create Firebase project
   - Download `google-services.json`
   - Place in `app/` folder

4. **Deploy web dashboard**
   - Push to GitHub
   - Connect Netlify for auto-deploy

### **For Content Managers**
1. **Access live dashboard** (your Netlify URL)
2. **Upload media** (videos, images)
3. **Create media boxes** (content groups)
4. **Design grid layouts** for TV displays
5. **Content automatically syncs** to Android TVs

## 🔧 **Configuration**

### **Android App**
- **Package name**: `com.example.castgrid`
- **Minimum SDK**: API 21 (Android 5.0)
- **Target SDK**: API 34 (Android 14)
- **Device ID**: Hardcoded unique identifier

### **Firebase Services**
- **Firestore**: Real-time database
- **Storage**: Media file hosting
- **Authentication**: Future user management

### **Web Dashboard**
- **Framework**: Vanilla JavaScript
- **Styling**: CSS3 with dark mode
- **Hosting**: Netlify static hosting

## 📱 **Android TV Compatibility**

- ✅ **Android TV** (Sony, Sharp, Philips)
- ✅ **Fire TV Stick** (Amazon)
- ✅ **NVIDIA Shield**
- ✅ **Generic Android TV boxes**
- ✅ **Smart TVs** with Android OS

## 🎯 **Use Cases**

- **Restaurants**: Menu boards, promotions
- **Offices**: Company announcements, schedules
- **Retail**: Product showcases, sales
- **Hospitals**: Patient information, wayfinding
- **Schools**: Announcements, schedules
- **Hotels**: Guest information, amenities

## 🔒 **Security**

- **Firebase security rules** for data protection
- **HTTPS encryption** (automatic with Netlify)
- **Device authentication** via unique IDs
- **Admin-only access** to content management

## 📊 **Performance**

- **CDN-powered** content delivery
- **Optimized media** compression
- **Real-time updates** without page refresh
- **Responsive design** for all screen sizes

## 🛠️ **Development**

### **Prerequisites**
- **Android Studio** (latest version)
- **Java 17** or higher
- **Git** for version control
- **Firebase account** for backend

### **Build Commands**
```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run tests
./gradlew test
```

## 📈 **Roadmap**

### **v1.1** (Current)
- ✅ Basic grid layouts
- ✅ Media playback
- ✅ Web admin dashboard
- ✅ Firebase integration

### **v1.2** (Next)
- [ ] User authentication
- [ ] Content scheduling
- [ ] Analytics dashboard
- [ ] Mobile app for management

### **v1.3** (Future)
- [ ] Advanced media effects
- [ ] Multi-tenant support
- [ ] API for integrations
- [ ] Live streaming support

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/castgrid/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/castgrid/discussions)

## 🙏 **Acknowledgments**

- **Firebase** for backend services
- **Netlify** for hosting
- **Android Jetpack** for modern UI
- **Material Design** for beautiful interfaces

---

**Ready to transform your digital signage?** Deploy to Netlify and start managing your TV content like a pro! 🎉

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/castgrid) 