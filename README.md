# 买不买

一个纯前端的交易心理趣味测试。用户在准备买入、加仓或卖出时回答 5 道情境题，获得可保存、可分享的“今日韭菜人格卡”。

产品不荐股、不预测涨跌、不采集股票或持仓数据。完整产品基线见 `PRODUCT_DESIGN.md`，当前交接状态见 `HANDOFF.md`。

作者：[vigorxu](https://github.com/vigorX777) · 公众号：懂点儿AI · X：[@vigorX777](https://x.com/vigorX777)

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
npm run lint
```

`npm test` 会先完成 Vinext/Sites 构建，再验证题库结构、连续换题、确定性评分、平分规则、副人格、隐藏人格、8 种人格可达性和服务端产品边界。

## 技术边界

- React/Vinext 单页站点，部署目标为 Codex Sites。
- 题库、评分与人格配置均位于本地 TypeScript。
- 仅使用 `localStorage` 恢复当前答题和最近结果。
- 角色图片与社交预览图全部本地化。
- 不使用数据库、账号、行情、新闻、券商、AI 或其他运行时 API。
