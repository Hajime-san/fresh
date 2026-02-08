変更ファイル（概要）
- `deno.lock`：依存関係のロックファイル更新
- `.zed/`：エディタ設定の追加（未追跡）
- `packages/fresh/app.tsx`：追加
- `packages/fresh/src/context.ts`：大幅更新
- `packages/fresh/src/context_test.tsx`：追加
- `packages/fresh/src/runtime/server/preact_hooks.ts`：更新

## 主な変更点

### `packages/fresh/src/context.ts`
- `ctx.render()` が **ストリーミング版の `renderStream()`** を使う構成に変更。
- **レンダリングキュー**（`enqueueRender`）を導入して、`renderStream()` 実行を直列化。
- SSR で `renderToReadableStream()` を使用して **ストリーミング出力**に移行。
- **プリパス**として `renderToStringAsync()` を実行し、`html/head/body` の有無を先に判定してから本レンダリングに反映。
- `<!DOCTYPE html>` を TransformStream で先頭に注入する方式に変更。
- 旧 `renderToString()` を使った非ストリーミングの実装はコメントアウトで残置。

### `packages/fresh/src/runtime/server/preact_hooks.ts`
- `RenderState` に **`prepass` フラグ**を追加。
- **プリパスで集めた `<Head>` 要素を本レンダリングに引き継ぐ**ための `PREPASS_HEAD_COMPONENTS` と `setRenderState()` のマージ処理を追加。
- プリパス中も **`owners` を追跡**するようにして、`<Partial>` が島内にあるかを検出可能に。
- プリパス中に **重複 `<Partial>` 名の検出**と **島内 `<Partial>` のエラー**を発生させるように拡張。
- プリパス中に `partialDepth` を更新して状態整合性を維持。

必要なら、他ファイル（`app.tsx`, `context_test.tsx` など）の差分要約も追加でまとめます。
