# 文件上传功能使用指南

## 概述

WebViewClient 现在支持统一的文件上传功能，可以处理 iOS 和 Android 两种不同的数据格式：

- **iOS**: 返回标准的 `File` 对象（通过 `<input type="file">`）
- **Android**: 返回 `base64` 字符串（通过 Flutter Bridge）

## 架构设计

### 统一处理方案

所有文件（无论是 iOS 的 File 还是 Android 的 base64）最终都会转换为 `File` 对象，然后使用标准的 `FormData` 进行上传。

```
iOS: File 对象 ───┐
                  ├──> File 对象 ───> FormData ───> fetch POST
Android: base64 ──┘
```

## Flutter Bridge 对接方式

### Web 端调用方式

Web 端通过 `window.flutter_inappwebview.callHandler` 调用 Flutter 方法：

```typescript
// 调用相机
window.flutter_inappwebview?.callHandler('openCamera', { source: 'web_clicked' })
    .then((result: any) => {
        if (result && result.base64) {
            // 处理 base64 数据
            const file = base64ToFile(result.base64, 'camera.jpg');
        }
    });

// 调用相册
window.flutter_inappwebview?.callHandler('openGallery', { source: 'web_clicked' })
    .then((result: any) => {
        if (result && result.base64) {
            // 处理 base64 数据
            const file = base64ToFile(result.base64, 'gallery.jpg');
        }
    });
```

### Flutter 端实现（Android）

#### 1. 注册 JavaScript Handler

在 Flutter 的 `InAppWebView` 中注册 Handler：

```dart
InAppWebView(
  initialSettings: InAppWebViewSettings(
    // ... 其他设置
  ),
  onWebViewCreated: (controller) {
    // 注册 JavaScript Handler
    controller.addJavaScriptHandler(
      handlerName: 'openCamera',
      callback: (args) async {
        return await _openCamera();
      },
    );
    
    controller.addJavaScriptHandler(
      handlerName: 'openGallery',
      callback: (args) async {
        return await _openGallery();
      },
    );
  },
  // ...
)
```

#### 2. 实现相机/相册功能

```dart
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

Future<Map<String, dynamic>> _openCamera() async {
  try {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85, // 压缩质量
    );
    
    if (image == null) {
      return {'error': '用户取消选择'};
    }
    
    // 读取文件并转换为 base64
    final bytes = await image.readAsBytes();
    final base64String = base64Encode(bytes);
    
    // 返回 base64 字符串（Web 端会自动添加 data URI 前缀）
    return {
      'base64': 'data:image/jpeg;base64,$base64String',
      'filename': image.name,
      'size': bytes.length,
    };
  } catch (e) {
    return {'error': e.toString()};
  }
}

Future<Map<String, dynamic>> _openGallery() async {
  try {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    
    if (image == null) {
      return {'error': '用户取消选择'};
    }
    
    // 读取文件并转换为 base64
    final bytes = await image.readAsBytes();
    final base64String = base64Encode(bytes);
    
    // 根据文件扩展名确定 MIME 类型
    String mimeType = 'image/jpeg';
    if (image.path.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (image.path.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (image.path.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    return {
      'base64': 'data:$mimeType;base64,$base64String',
      'filename': image.name,
      'size': bytes.length,
    };
  } catch (e) {
    return {'error': e.toString()};
  }
}
```

#### 3. Android 权限配置

在 `android/app/src/main/AndroidManifest.xml` 中添加权限：

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<!-- Android 13+ -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

#### 4. 返回数据格式

Flutter Handler 必须返回以下格式的 JSON：

**成功时：**
```json
{
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "filename": "IMG_20240101_120000.jpg",
  "size": 123456
}
```

**失败时：**
```json
{
  "error": "错误信息"
}
```

**注意：**
- `base64` 字段必须包含完整的 data URI（`data:image/jpeg;base64,...`）
- 如果只返回纯 base64 字符串，Web 端会从文件名推断 MIME 类型
- `filename` 和 `size` 是可选字段，用于日志记录

### Flutter 端实现（iOS）

iOS 端**不需要**实现 Bridge Handler，因为 Web 端直接使用原生的 `<input type="file">`：

```html
<input
  type="file"
  accept="image/*"
  capture="environment"  <!-- 可选：优先使用后置摄像头 -->
/>
```

iOS 会自动处理文件选择，返回标准的 `File` 对象。

### 数据流对比

#### Android 流程：
```
用户点击 → Web 调用 callHandler('openCamera') 
→ Flutter 打开相机 → 用户拍照 
→ Flutter 读取文件 → 转换为 base64 
→ 返回给 Web → Web 转换为 File 对象 → 上传
```

#### iOS 流程：
```
用户点击 → 触发 <input type="file"> 
→ iOS 原生选择器 → 用户选择文件 
→ 直接返回 File 对象 → 上传
```

### 错误处理

Web 端会自动处理以下错误情况：

1. **Bridge 不存在**：在非 WebView 环境中，`window.flutter_inappwebview` 为 `undefined`，不会报错
2. **用户取消**：Flutter 返回 `null` 或 `{'error': '...'}` 时，Web 端会记录日志但不报错
3. **Base64 转换失败**：会抛出明确的错误信息，便于调试

### 调试建议

1. **查看控制台日志**：所有操作都有详细的 `[FileUpload]` 日志
2. **验证返回数据**：检查 Flutter 返回的 base64 格式是否正确
3. **测试 Bridge 连接**：在 Web 端检查 `window.flutter_inappwebview` 是否存在
4. **文件大小限制**：注意 base64 编码会增加约 33% 的大小

### 完整示例

#### Flutter 端完整代码示例：

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:image_picker/image_picker.dart';

class WebViewPage extends StatefulWidget {
  @override
  _WebViewPageState createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  InAppWebViewController? webViewController;
  final ImagePicker _picker = ImagePicker();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: WebUri('http://192.168.66.148:5173/'),
        ),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          useHybridComposition: true,
        ),
        onWebViewCreated: (controller) {
          webViewController = controller;
          
          // 注册 Handler
          controller.addJavaScriptHandler(
            handlerName: 'openCamera',
            callback: (args) => _handleOpenCamera(),
          );
          
          controller.addJavaScriptHandler(
            handlerName: 'openGallery',
            callback: (args) => _handleOpenGallery(),
          );
        },
      ),
    );
  }

  Future<Map<String, dynamic>> _handleOpenCamera() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      
      if (image == null) {
        return {'error': '用户取消'};
      }
      
      final bytes = await image.readAsBytes();
      final base64 = base64Encode(bytes);
      
      return {
        'base64': 'data:image/jpeg;base64,$base64',
        'filename': image.name,
        'size': bytes.length,
      };
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> _handleOpenGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      
      if (image == null) {
        return {'error': '用户取消'};
      }
      
      final bytes = await image.readAsBytes();
      final base64 = base64Encode(bytes);
      
      // 根据文件扩展名确定 MIME 类型
      String mimeType = 'image/jpeg';
      final ext = image.path.toLowerCase().split('.').last;
      if (ext == 'png') mimeType = 'image/png';
      else if (ext == 'gif') mimeType = 'image/gif';
      else if (ext == 'webp') mimeType = 'image/webp';
      
      return {
        'base64': 'data:$mimeType;base64,$base64',
        'filename': image.name,
        'size': bytes.length,
      };
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}
```

### 注意事项

1. **Base64 大小**：大文件转换为 base64 会占用较多内存，建议压缩图片（`imageQuality: 85`）
2. **MIME 类型**：尽量返回正确的 MIME 类型，Web 端会自动处理
3. **错误处理**：确保所有异常都被捕获并返回错误信息
4. **权限检查**：在打开相机/相册前检查权限
5. **文件大小限制**：建议限制文件大小，避免内存问题
