# Tank Arena — Cyberpunk Roguelike

赛博朋克风格房间制 Roguelike 坦克大战。纯前端实现，ES6 Modules，零构建依赖。

## 操作说明

- **移动**: WASD 或方向键
- **瞄准**: 鼠标控制炮塔方向
- **射击**: 鼠标左键

## 游戏机制

| 系统 | 描述 |
|------|------|
| 核心循环 | 房间制 — 清敌 → 选门 → 下一房间 → Boss → 下一层 |
| 视角操控 | 俯视双摇杆：WASD 移动车体 + 鼠标独立瞄准炮塔 |
| 敌人 | 6 种 AI + 4 层 Boss：无人机 / 突击机甲 / 狙击炮台 / 自爆蜘蛛 / 护盾守卫 / 骇客节点 |
| 子弹 | 6 种类型：普通 / 反弹 / 穿透 / 散射 / 爆破 / 能量，商店进化 |
| 地形 | 5 种交互地形：掩体 / 能量屏障 / 传送带 / 爆炸桶 / 电网 |
| 商店 | 击杀掉落数据碎片，房间间购买 11 种升级，可刷新 |
| 局外成长 | 数据核心解锁三条天赋树，永久加成 |
| 主题 | 4 层赛博朋克区域：工业废墟 → 数据中心 → 地下黑市 → 核心枢纽 |

## 运行方式

本项目使用 ES6 Modules，必须通过 HTTP 服务器运行，不能直接双击打开。

```bash
npx serve .
```

浏览器打开 `http://localhost:3000`。

## 项目结构

```
tank-arena/
├── index.html          # 入口页面
├── style.css           # 赛博朋克 UI 样式
└── js/
    ├── main.js         # 入口：游戏主循环、状态机、敌人 AI
    ├── config.js       # 全局常量与游戏平衡数值
    ├── entities.js     # 实体类：Tank / Enemy / Bullet / Pickup / Terrain / Particle
    ├── combat.js       # 碰撞检测、伤害计算、爆炸系统
    ├── room.js         # 房间生成与楼层地图
    ├── terrain.js      # 交互地形系统
    ├── shop.js         # 碎片经济与升级商店
    ├── meta.js         # 局外成长：数据核心与天赋树
    ├── renderer.js     # Canvas 赛博朋克渲染器
    ├── input.js        # 键盘鼠标输入抽象
    ├── hud.js          # 游戏内 HUD
    └── overlay.js      # 主菜单 / 商店 / 天赋 / 死亡结算界面
```

## 测试

```bash
npm install
npm test
```

64 项单元测试，覆盖实体、战斗、地形、房间、商店、成长系统。

## 技术栈

- HTML5 Canvas
- CSS3
- Vanilla JavaScript (ES6 Modules)
- Vitest (单元测试)
