# Bottom sheets

`presentationStyle: 'bottom'` presents a Material 3 bottom sheet on Android. It has a drag handle and rounded top corners, and swiping it down cancels it. A long list opens part-way and drags up to expand. Cancel is the last row, and swipe down, back and a backdrop tap resolve it as usual.

On iOS, `'bottom'` is the standard action sheet, the same as leaving `presentationStyle` unset. `anchor` is ignored.

```ts
await showActionSheetWithOptions({
  options: [...],
  presentationStyle: 'bottom',
});
```

## Enabling Material

The bottom sheet needs `com.google.android.material`, which this library does not add unless you ask for it.

**React Native CLI:**

```properties
# android/gradle.properties
unifiedActionSheet.material=true
```

**Expo:** use the config plugin instead, then rebuild with `npx expo prebuild` or `npx expo run:android`:

```json
{
  "expo": {
    "plugins": [["react-native-unified-action-sheet", { "material": true }]]
  }
}
```

Without it, `'bottom'` falls back to the centered dialog, and a warning in development tells you what to set.

## Material version

The library pins a tested Material version (1.12.0). If your app already uses Material, Gradle resolves the two to the higher version. To choose one yourself, use any of:

- `ext.materialVersion` in `android/build.gradle`
- `unifiedActionSheet.materialVersion` in `gradle.properties`
- `materialVersion` in the Expo plugin's options

The sheet brings its own Material 3 theme, so your app's theme can stay plain AppCompat.

## Limitations

Prompts don't support `'bottom'` and always present centered.
