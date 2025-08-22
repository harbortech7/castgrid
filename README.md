# CastGrid Web Admin Dashboard v1.4.0

A comprehensive, production-ready web admin dashboard for managing CastGrid digital signage systems. Built with modern web technologies and optimized for performance, accessibility, and ease of use.

## 🚀 New in v1.4.0

### Enhanced File Management
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Progress Tracking**: Real-time upload progress with status indicators
- **File Validation**: Automatic file type and format validation
- **Upload Queue**: Manage multiple uploads with queue system
- **Storage Analytics**: Monitor storage usage and get recommendations

### Advanced Grid Layout Designer
- **Visual Grid Presets**: Pre-configured layouts (1, 2, 4, 6, 8 zones)
- **Drag & Drop Assignment**: Assign media boxes to grid zones visually
- **Real-time Updates**: See layout changes instantly
- **Grid Size Selector**: Change grid configuration on the fly
- **Zone Management**: Individual zone status and content display

### Enhanced Media Library
- **Advanced Search**: Find media by filename, type, or box
- **Bulk Operations**: Select multiple items for batch operations
- **Organization Tools**: Sort by type, date, or size
- **Batch Processing**: Rename multiple files or update durations
- **Media Preview**: Preview content before assignment

### Performance & Sync
- **Offline Support**: Work without internet connection
- **Real-time Sync**: Monitor sync status and errors
- **Virtual Scrolling**: Handle large lists efficiently
- **Lazy Loading**: Load media content on demand
- **Request Batching**: Reduce API calls for better performance
- **Multi-layer Caching**: Local storage and memory caching

## 🛠️ Quick Start

### 1. Deploy to Netlify
1. Fork this repository to your GitHub account
2. Create a new site on Netlify and connect your fork
3. Set environment variables in Netlify → Site settings → Environment variables:
   ```
   GITHUB_REPO = yourusername/castgrid
   GITHUB_BRANCH = main
   GITHUB_TOKEN = your-github-token
   ADMIN_TOKEN = your-secret-admin-token
   ```

### 2. Create Tenant Data Structure
In your GitHub repository, create the following structure:
```
data/
  tenants/
    yourtenant/
      devices.json      → []
      grids.json        → []
      media-boxes.json  → []
      media-items.json  → []
```

### 3. Access Dashboard
1. Open your Netlify site URL
2. Use Admin Access Code authentication:
   - Admin Access Code: Your `ADMIN_TOKEN` value
   - Tenant: Your tenant name (e.g., `yourtenant`)
3. Click "Use Access Code" → "Test API Connection"

## 📁 File Management

### Uploading Files
1. **Drag & Drop**: Simply drag files onto the upload zone
2. **File Types Supported**:
   - **Videos**: MP4, AVI, MOV, MKV, WebM, M4V
   - **Images**: JPG, PNG, GIF, BMP, WebP
3. **Upload Queue**: Monitor progress and status
4. **Automatic Organization**: Files are automatically categorized and stored

### Storage Management
- **Usage Monitoring**: Track storage consumption
- **Smart Recommendations**: Get storage optimization tips
- **File Analytics**: View file type distribution and recent uploads
- **Cleanup Tools**: Archive or remove unused files

## 🎨 Grid Layout Designer

### Creating Grids
1. **Select Device**: Choose the target device from the dropdown
2. **Choose Layout**: Select from preset grid configurations:
   - **1 Grid**: Full screen display
   - **2 Grids**: Split screen layout
   - **4 Grids**: Quad layout (2x2)
   - **6 Grids**: Six zones (2x3)
   - **8 Grids**: Eight zones (2x4)

### Assigning Content
1. **Drag Media Boxes**: Drag media boxes from the library to grid zones
2. **Visual Feedback**: See zone status and assigned content
3. **Real-time Updates**: Layout changes are applied immediately
4. **Zone Management**: Remove assignments or reassign content

## 📚 Media Library Management

### Search & Filter
- **Search Bar**: Find files by name, type, or box
- **Type Filtering**: Filter by video or image
- **Box Filtering**: Show files from specific media boxes
- **Date Filtering**: Sort by upload date

### Bulk Operations
1. **Select Items**: Use checkboxes to select multiple files
2. **Bulk Actions**:
   - **Delete Selected**: Remove multiple files at once
   - **Move to Box**: Assign files to media boxes
   - **Batch Rename**: Add prefixes to multiple files
   - **Update Duration**: Set display time for multiple items

### Organization Tools
- **Sort by Type**: Group videos and images together
- **Sort by Date**: Show newest or oldest files first
- **Sort by Size**: Identify large files for optimization
- **Media Boxes**: Organize content into themed collections

## ⚡ Performance Features

### Offline Mode
- **Automatic Detection**: Dashboard detects connection status
- **Change Queuing**: Queue changes when offline
- **Sync on Reconnect**: Automatically sync when connection returns
- **Offline Indicator**: Clear visual feedback for offline state

### Caching System
- **Local Storage**: Cache data in browser storage
- **Memory Cache**: Fast in-memory caching
- **Automatic Cleanup**: Remove expired cache entries
- **Performance Monitoring**: Track cache hit rates

### Request Optimization
- **Batch Operations**: Combine multiple requests
- **Lazy Loading**: Load content only when needed
- **Virtual Scrolling**: Handle large datasets efficiently
- **Debounced Search**: Reduce search API calls

## 🎯 Accessibility Features

### Visual Enhancements
- **High Contrast Mode**: Toggle high contrast for better visibility
- **Large Text Mode**: Increase text size for readability
- **Color Blind Support**: Optimized color schemes
- **Focus Indicators**: Clear focus states for keyboard navigation

### Keyboard Navigation
- **Tab Navigation**: Navigate with Tab key
- **Shortcut Keys**: Quick access to common functions
- **Skip Links**: Jump to main content
- **ARIA Labels**: Screen reader support

## 📱 Mobile Responsiveness

### Responsive Design
- **Mobile First**: Optimized for small screens
- **Touch Friendly**: Large touch targets
- **Adaptive Layouts**: Grids adjust to screen size
- **Mobile Navigation**: Collapsible sidebar and menus

### Performance on Mobile
- **Optimized Loading**: Faster initial load times
- **Touch Gestures**: Swipe and pinch support
- **Offline Capability**: Work without stable connection
- **Battery Optimization**: Efficient resource usage

## 🔧 Technical Details

### Architecture
- **Modular JavaScript**: Organized, maintainable code
- **Event-Driven**: Responsive to user interactions
- **Promise-Based**: Modern async/await patterns
- **Error Handling**: Comprehensive error recovery

### Netlify Functions
- **upload-file.js**: Enhanced file upload with validation
- **storage-stats.js**: Storage analytics and monitoring
- **batch.js**: Batch operations for performance
- **devices.js**: Device management
- **grids.js**: Grid layout management
- **media-items.js**: Media file management
- **media-boxes.js**: Media box organization

### Security Features
- **Admin Token Authentication**: Secure access control
- **Tenant Isolation**: Multi-tenant data separation
- **File Validation**: Prevent malicious uploads
- **CORS Protection**: Secure cross-origin requests

## 🚀 Deployment

### Netlify Configuration
The dashboard includes optimized Netlify configuration:
- **Build Settings**: Automatic build and deployment
- **Security Headers**: XSS and CSRF protection
- **Caching Strategy**: Optimized for performance
- **SPA Routing**: Single page application support

### Environment Variables
Required environment variables:
```bash
GITHUB_REPO=owner/repository
GITHUB_BRANCH=main
GITHUB_TOKEN=your-github-token
ADMIN_TOKEN=your-secret-token
```

### Custom Domain
- **SSL Certificate**: Automatic HTTPS
- **CDN Distribution**: Global content delivery
- **Custom Domain**: Use your own domain name
- **DNS Management**: Automatic DNS configuration

## 📊 Monitoring & Analytics

### Dashboard Statistics
- **Device Count**: Total managed devices
- **Media Items**: Total uploaded files
- **Storage Usage**: Current storage consumption
- **Grid Zones**: Active grid configurations

### Performance Metrics
- **Load Times**: Page and component load times
- **Cache Performance**: Cache hit rates and efficiency
- **API Response Times**: Backend performance monitoring
- **Error Rates**: Track and monitor errors

### Storage Analytics
- **File Type Distribution**: Video vs image usage
- **Size Analysis**: Storage consumption patterns
- **Upload Trends**: Recent activity monitoring
- **Optimization Recommendations**: Storage improvement tips

## 🔮 Future Enhancements

### Planned Features
- **Advanced Scheduling**: Time-based content management
- **User Management**: Multi-user access control
- **Analytics Dashboard**: Detailed usage statistics
- **Mobile App**: Native mobile management app
- **API Documentation**: Developer API reference
- **Plugin System**: Extensible functionality

### Performance Improvements
- **Service Worker**: Advanced offline capabilities
- **WebAssembly**: Native performance for heavy operations
- **Progressive Web App**: App-like experience
- **Real-time Updates**: WebSocket integration

## 📞 Support & Documentation

### Getting Help
- **Documentation**: Comprehensive feature guides
- **Troubleshooting**: Common issues and solutions
- **API Reference**: Backend function documentation
- **Community**: User forums and discussions

### Contributing
- **Code Contributions**: Submit pull requests
- **Bug Reports**: Report issues and bugs
- **Feature Requests**: Suggest new functionality
- **Documentation**: Help improve guides

---

**🎉 CastGrid Web Admin Dashboard v1.4.0**

*Professional digital signage management with enterprise-grade features, performance, and reliability.*

For more information, visit the main [CastGrid project repository](https://github.com/yourusername/castgrid). 