# MCP (Model Context Protocol) 完全入门教程

> 生成日期：2026-05-31
> 热度：⭐⭐⭐⭐⭐ — AI Agent 生态最火标准协议
> 来源：[MCP 官方文档](https://modelcontextprotocol.io)

---

## 一、MCP 是什么？

**MCP（Model Context Protocol）** 是 Anthropic 推出的开源标准协议，用于连接 AI 应用与外部系统。

> 一句话理解：**MCP 就是 AI 应用的 USB-C 接口**——就像 USB-C 统一了设备连接标准，MCP 统一了 AI 与外部工具/数据源的连接方式。

### 它解决了什么问题？

以前，每个 AI 工具要接入外部数据（数据库、API、文件系统），都需要写定制集成代码。MCP 把这件事标准化了：

| 没有 MCP | 有 MCP |
|----------|--------|
| 每个工具单独写集成 | 一次开发，到处使用 |
| Claude 要写一套代码，ChatGPT 写另一套 | 同一个 MCP Server 两边都能用 |
| 维护成本高 | 维护成本低，生态共享 |

---

## 二、核心架构

MCP 采用 **客户端-服务器** 架构，包含三个关键角色：

```
┌─────────────────────────────────────┐
│         MCP Host（AI 应用）          │
│   Claude / ChatGPT / VS Code / Cursor  │
│                                     │
│   ┌───────────┐  ┌───────────┐      │
│   │ Client 1  │  │ Client 2  │ ...  │
│   └─────┬─────┘  └─────┬─────┘      │
└─────────┼──────────────┼────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼─────┐
    │ Server A  │  │ Server B  │
    │ (文件系统) │  │ (数据库)   │
    └───────────┘  └───────────┘
```

### 三个角色的职责

| 角色 | 说明 | 示例 |
|------|------|------|
| **Host（宿主）** | AI 应用本身，管理多个 Client | Claude Desktop、VS Code、Cursor |
| **Client（客户端）** | 与单个 Server 保持连接 | Host 为每个 Server 创建一个 Client |
| **Server（服务器）** | 提供工具、资源和数据 | 文件系统 Server、数据库 Server、Sentry Server |

### 两层协议

```
┌─────────────────────────────┐
│     Transport Layer         │  ← 通信层（STDIO / Streamable HTTP）
│  ┌───────────────────────┐  │
│  │    Data Layer          │  │  ← JSON-RPC 2.0 协议
│  │  Tools / Resources    │  │     Tools（工具）、Resources（资源）、Prompts（提示模板）
│  │  Prompts / Sampling   │  │     Sampling（采样）、Elicitation（用户交互）
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- **Transport Layer（传输层）**：定义通信机制
  - `STDIO`：本地进程间通信（标准输入/输出），零网络开销
  - `Streamable HTTP`：远程通信，支持 OAuth 认证

- **Data Layer（数据层）**：基于 JSON-RPC 2.0，定义三大原语
  - **Tools**：AI 可调用的执行函数（如文件操作、API 调用）
  - **Resources**：提供上下文信息的数据源（如文件内容、数据库记录）
  - **Prompts**：可复用的交互模板（如系统提示、few-shot 示例）

---

## 三、快速上手：用 Python (FastMCP) 构建第一个 MCP Server

### 3.1 环境准备

```bash
# 安装 FastMCP（Python SDK）
pip install fastmcp
```

### 3.2 创建一个简单的天气查询 Server

```python
# weather_server.py
from fastmcp import FastMCP

mcp = FastMCP("WeatherServer")

@mcp.tool()
def get_weather(city: str) -> dict:
    """获取城市天气信息"""
    mock_data = {
        "北京": {"temp": "28°C", "weather": "晴", "humidity": "45%"},
        "上海": {"temp": "32°C", "weather": "多云", "humidity": "72%"},
        "深圳": {"temp": "30°C", "weather": "阵雨", "humidity": "85%"},
    }
    return mock_data.get(city, {"error": f"未找到城市 {city} 的天气数据"})

@mcp.tool()
def forecast(city: str, days: int = 3) -> dict:
    """获取未来 N 天天气预报"""
    return {
        "city": city,
        "days": days,
        "forecast": [
            {"date": f"Day {i+1}", "temp": f"{28-i}~{33-i}°C", "weather": "晴转多云"}
            for i in range(days)
        ]
    }

@mcp.resource("weather://cities")
def list_cities() -> str:
    """可用城市列表"""
    return "北京, 上海, 深圳, 广州, 杭州"

@mcp.prompt()
def weather_prompt(city: str) -> str:
    """天气分析提示模板"""
    return f"请分析 {city} 当前的天气状况，并给出出行建议。"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### 3.3 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件（`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["path/to/weather_server.py"],
      "env": {}
    }
  }
}
```

重启 Claude Desktop 后，你就可以直接问 Claude："北京今天天气怎么样？"——它会自动调用你的 MCP Server。

### 3.4 在 VS Code 中配置

在 VS Code 的 `settings.json` 中：

```json
{
  "mcp.servers": {
    "weather": {
      "command": "python",
      "args": ["path/to/weather_server.py"]
    }
  }
}
```

---

## 四、高级用法

### 4.1 连接真实数据库

```python
from fastmcp import FastMCP
import sqlite3

mcp = FastMCP("DatabaseServer")

DB_PATH = "./myapp.db"

@mcp.tool()
def query_database(sql: str) -> list[dict]:
    """执行只读 SQL 查询"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        results = [dict(row) for row in cursor.fetchall()]
        return results
    finally:
        conn.close()

@mcp.resource("db://schema")
def get_schema() -> str:
    """获取数据库表结构"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table'")
    return "\n\n".join(row[0] for row in cursor.fetchall() if row[0])
```

### 4.2 远程 HTTP Server（Streamable HTTP）

```python
from fastmcp import FastMCP

mcp = FastMCP("RemoteServer")

@mcp.tool()
def search_documents(query: str) -> list[str]:
    """搜索文档库"""
    return ["doc1.pdf", "doc2.pdf"]

# 启动为 HTTP Server
mcp.run(transport="streamable-http", host="0.0.0.0", port=8000)
```

客户端配置使用 `url` 而非 `command`：

```json
{
  "mcpServers": {
    "remote-docs": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

### 4.3 调用 LLM（Sampling 原语）

MCP Server 可以反向请求 Host 的 LLM 能力：

```python
from fastmcp import FastMCP, Context

mcp = FastMCP("SmartServer")

@mcp.tool()
async def summarize_with_llm(text: str, ctx: Context) -> str:
    """用 Host 的 LLM 来总结文本"""
    result = await ctx.sample(
        messages=[{"role": "user", "content": f"请总结以下内容：\n{text}"}],
        max_tokens=500
    )
    return result.content[0].text
```

---

## 五、生态系统现状（2026年5月）

### 支持 MCP 的主流平台

| 平台 | 类型 | 支持方式 |
|------|------|----------|
| **Claude Desktop / Claude Code** | AI 助手 | 原生支持 |
| **ChatGPT** | AI 助手 | 原生支持 |
| **VS Code + Copilot** | IDE | 原生支持 |
| **Cursor** | AI 编辑器 | 原生支持 |
| **Zed** | 编辑器 | 原生支持 |
| **Windsurf** | IDE | 原生支持 |

### 热门 MCP Server 项目

- **[awesome-mcp-servers](https://github.com/modelcontextprotocol/servers)**：Anthropic 官方参考实现集合
- **[mcp-servers.org](https://mcpservers.org)**：社区 MCP Server 导航站
- **MCPJam**：MCP 应用开发平台

### 主流 SDK

| 语言 | SDK | 状态 |
|------|-----|------|
| Python | `fastmcp` | ✅ 稳定 |
| TypeScript/Node | `@modelcontextprotocol/sdk` | ✅ 稳定 |
| Java | Spring AI MCP | ✅ 稳定 |
| Go | `mcp-go` | ✅ 稳定 |
| Rust | `rmcp` | ✅ 稳定 |

---

## 六、最佳实践

### ✅ 推荐做法

1. **工具描述要清晰**：`@mcp.tool()` 的 docstring 是 AI 理解工具用途的关键，写清楚输入输出
2. **用 Resources 提供上下文**：把 schema、配置、文档等静态信息放在 Resource 里，而非硬编码在工具中
3. **错误处理要友好**：返回结构化的错误信息，而非抛异常
4. **权限控制**：涉及敏感操作时使用 Elicitation 原语请求用户确认
5. **使用 Notifications**：当工具列表变化时通知客户端

### ❌ 常见坑

1. **不要在 Server 里内嵌 LLM**：用 Sampling 原语让 Host 提供，避免模型绑定
2. **不要忽略 capability negotiation**：初始化时正确声明能力
3. **不要让工具无限制访问资源**：数据库查询加只读限制，文件操作加路径白名单

---

## 七、总结

MCP 正在成为 AI Agent 时代的基础设施标准。对开发者来说：

- **如果你构建 AI 应用**：接入 MCP Server 能让你的产品能力倍增
- **如果你提供数据/工具**：写 MCP Server 是触达海量 AI 用户的最高效方式
- **如果你只是使用者**：越来越多的 MCP Server 意味着你的 AI 助手越来越强

> 推荐进一步阅读：
> - [MCP 官方文档](https://modelcontextprotocol.io/docs/getting-started/intro)
> - [MCP 协议规范](https://modelcontextprotocol.io/specification/latest)
> - [FastMCP GitHub](https://github.com/jlowin/fastmcp)
> - [Anthropic MCP 入门教程](https://docs.anthropic.com/en/docs/claude-code/mcp)
