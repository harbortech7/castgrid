# 🧪 CastGrid Testing Guide

This guide will help you test your complete CastGrid digital signage system, from backend setup to Android app functionality.

## 🚀 Quick Start Testing

### Prerequisites
- ✅ Firebase project created
- ✅ `google-services.json` uploaded to web admin
- ✅ Android app built and installed on device/emulator
- ✅ Web admin dashboard accessible

## 📋 Step-by-Step Testing

### 1. **Web Admin Dashboard Setup**
1. Open `web-admin/index.html` in your browser
2. Go to "Firebase Setup" section
3. Upload your `google-services.json` file
4. Verify Firebase connection is successful

### 2. **Create Test Device**
1. Navigate to "Devices" section
2. Click "Add New Device"
3. Fill in:
   - **Device ID**: `tv_a7f3k9m2_2024` (hardcoded in Android app)
   - **Location**: "Test Conference Room"
   - **Grid Count**: 4 (2x2 layout)
4. Click "Create Device"

### 3. **Upload Test Media**
1. Go to "Media Library" section
2. Click "Upload Media"
3. Upload test files:
   - **Videos**: Short MP4 files (5-30 seconds)
   - **Images**: JPG/PNG files
4. Add metadata for each file

### 4. **Create Media Boxes**
1. Navigate to "Media Boxes" section
2. Click "Create New Media Box"
3. Name it "Test Content Box 1"
4. Add your uploaded media items
5. Create additional boxes as needed

### 5. **Design Grid Layout**
1. Go to "Grid Layout Designer"
2. Select your device (`tv_a7f3k9m2_2024`)
3. Assign media boxes to grid positions:
   - **Grid 1** (top-left): Test Content Box 1
   - **Grid 2** (top-right): Test Content Box 2
   - **Grid 3** (bottom-left): Leave empty or assign content
   - **Grid 4** (bottom-right): Leave empty or assign content

### 6. **Test Android App**
1. Launch your CastGrid Android app
2. App should automatically connect to Firebase
3. Fetch grid layout and media assignments
4. Media should start playing in assigned grids

## 🔧 Automated Test Setup

For quick testing, use the test script in the browser console:

```javascript
// After Firebase is initialized in web admin dashboard
const testSetup = new CastGridTestSetup();

// Create complete test environment
await testSetup.createTestData();

// Check what was created
await testSetup.checkTestData();

// Clear test data when done
await testSetup.clearTestData();
```

## 📱 Android App Testing Checklist

### Connection Test
- [ ] App launches without crashes
- [ ] Firebase connection established
- [ ] Device ID matches backend (`tv_a7f3k9m2_2024`)
- [ ] Grid layout loaded from backend

### Media Playback Test
- [ ] Videos play in assigned grids
- [ ] Images display correctly
- [ ] Media transitions work
- [ ] Empty grids show placeholder

### Real-time Updates Test
- [ ] Changes in web admin reflect in Android app
- [ ] Grid assignments update live
- [ ] New media loads automatically

## 🐛 Troubleshooting

### Common Issues

#### **App Won't Connect to Firebase**
- Check `google-services.json` is correct
- Verify Firebase project has Firestore enabled
- Check internet connection on device

#### **No Media Playing**
- Verify media files uploaded successfully
- Check media box assignments in grid layout
- Ensure media URLs are accessible

#### **Grid Layout Not Loading**
- Check device ID matches between app and backend
- Verify grids are created and assigned
- Check Firestore security rules

#### **Media Not Updating**
- Check real-time listeners are working
- Verify media box content is assigned
- Check media file permissions

### Debug Steps
1. Check browser console for errors
2. Verify Firebase console shows data
3. Check Android logcat for app errors
4. Test with simple media files first

## 📊 Testing Scenarios

### **Basic Functionality**
- Single device with 2x2 grid
- One media box with mixed content
- Basic video and image playback

### **Advanced Features**
- Multiple media boxes
- Dynamic grid layout changes
- Real-time content updates
- Multiple device support

### **Edge Cases**
- Empty grids
- Invalid media files
- Network interruptions
- Large media files

## 🎯 Success Criteria

Your CastGrid system is working correctly when:

1. ✅ Web admin dashboard connects to Firebase
2. ✅ Devices can be created and managed
3. ✅ Media uploads successfully
4. ✅ Media boxes organize content properly
5. ✅ Grid layouts assign content correctly
6. ✅ Android app connects and displays content
7. ✅ Real-time updates work
8. ✅ Media plays without errors

## 🔄 Continuous Testing

- Test after each major change
- Verify real-time updates work
- Test with different media types
- Validate grid layout changes
- Monitor Android app performance

## 📞 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Firebase console for errors
3. Check Android logcat for app errors
4. Verify all configuration files are correct
5. Test with the automated test script

---

**Happy Testing! 🎉** Your CastGrid system should now be fully functional and ready for production use.
