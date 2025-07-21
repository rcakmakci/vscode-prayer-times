# PrayTime - VSCode Prayer Times Extension

A professional-grade VSCode extension that displays Islamic prayer times with a modern, senior-level architecture.

## 🌟 Features

- **Real-time Prayer Times**: Automatically detects your location and displays accurate prayer times
- **Smart Caching**: Intelligent caching system to minimize API calls and improve performance
- **Current Prayer Highlighting**: Visual indicators showing current and next prayer times
- **Auto-refresh**: Automatic updates every 4 hours and manual refresh capability
- **Modern UI**: Clean, VSCode-themed interface with Turkish prayer names
- **Offline Support**: Graceful fallback when network is unavailable
- **Debug Mode**: Built-in debugging tools for troubleshooting

## 🏗️ Architecture

This extension follows enterprise-level architectural patterns:

### Core Components

- **Services Layer**: Centralized HTTP and Cache services with retry logic
- **Providers Layer**: Specialized providers for geolocation, prayer times, and webview
- **Configuration Management**: Centralized configuration with type safety
- **Type System**: Comprehensive TypeScript interfaces and enums
- **Error Handling**: Robust error handling with user-friendly messages

### Design Patterns

- **Dependency Injection**: Clean separation of concerns
- **Singleton Pattern**: Centralized state management
- **Observer Pattern**: Event-driven webview communication
- **Strategy Pattern**: Multiple API endpoints with fallback
- **Cache-Aside Pattern**: Intelligent caching strategy

## 📁 Project Structure

```
src/
├── config/           # Configuration management
│   └── extension.config.ts
├── services/         # Business logic services
│   ├── CacheService.ts
│   └── HttpService.ts
├── providers/        # VSCode-specific providers
│   ├── GeoLocationProvider.ts
│   ├── PrayerTimesProvider.ts
│   └── PrayerViewProvider.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── webview/         # UI components
│   ├── index.html
│   ├── script.js
│   └── style.css
└── extension.ts     # Main extension entry point
```

## 🚀 Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile: `npm run compile`
4. Debug: Press F5 in VSCode

## 🔧 Commands

- **Refresh Prayer Times**: Manually refresh prayer times data
- **Clear Cache**: Clear cached data and refresh

## 🎨 UI Features

- **Turkish Prayer Names**: İmsak, Güneş, Öğle, İkindi, Günbatımı, Akşam, Yatsı
- **Visual Indicators**: Current prayer (●) and next prayer (○) highlighting
- **Responsive Design**: Adapts to different panel sizes
- **Loading States**: Visual feedback during data fetching
- **Error Handling**: User-friendly error messages

## ⚡ Performance

- **Smart Caching**: 24-hour cache with automatic expiration
- **API Failover**: Multiple geolocation APIs for reliability
- **Retry Logic**: Exponential backoff for failed requests
- **Memory Efficient**: Minimal memory footprint with cleanup

## 🛡️ Error Handling

- Graceful fallback to default location (Istanbul, Turkey)
- Network timeout handling (10 seconds)
- API failure recovery with multiple endpoints
- User-friendly error messages in Turkish

## 🔄 Data Sources

- **Prayer Times**: Aladhan API with Turkey Diyanet method
- **Geolocation**: Multiple IP geolocation services
  - ipapi.co
  - ipinfo.io
  - ip-api.com

## 🎯 Technical Highlights

### HTTP Service
- Configurable retry attempts with exponential backoff
- Request timeout management
- Multiple endpoint failover
- Generic type support

### Cache Service
- Generic cache implementation
- Automatic expiration handling
- Memory-efficient storage
- Easy cache invalidation

### Extension State Management
- Centralized state with singleton pattern
- Proper resource cleanup
- Event-driven architecture
- Lifecycle management

## 🧪 Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Lint code
npm run lint

# Type checking
npm run check-types

# Build for production
npm run package
```

## 🤝 Contributing

This project follows professional development standards:

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Proper error handling throughout
- Comprehensive type definitions
- Clean architecture principles

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Aladhan API for accurate prayer times
- Various IP geolocation services
- VSCode extension development community
