# AI Agent开发实战教程

## 介绍

本教程介绍如何开发AI Agent，这是2026年最热门的AI应用方向之一。

## 一、核心概念

### 1.1 Agent 架构

一个完整的 AI Agent 包含四大模块：

```
┌─────────────────────────────────────┐
│            AI Agent                │
│  ┌─────────┐  ┌──────────────┐  │
│  │ 规划模块 │  │  记忆模块     │  │
│  │ Planning │  │  Memory       │  │
│  └────┬────┘  └──────┬───────┘  │
│       │                │           │
│  ┌────▼────┐  ┌──────▼───────┐  │
│  │ 工具使用 │  │  行动执行     │  │
│  │ Tools    │  │  Action       │  │
│  └─────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

- **规划（Planning）**：将复杂任务分解为子任务，制定执行计划
- **记忆（Memory）**：短期记忆（上下文）+ 长期记忆（向量数据库）
- **工具使用（Tools）**：调用外部 API、搜索引擎、代码执行器等
- **行动（Action）**：执行具体操作，如发送邮件、操作文件、控制设备

### 1.2 主流框架对比

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **LangChain** | 生态最完整，组件丰富 | 快速原型、复杂流水线 |
| **AutoGPT** | 自主循环执行，目标驱动 | 开放式任务、自主探索 |
| **CrewAI** | 多Agent协作，角色分工 | 团队协作场景 |
| **OpenAI Assistants API** | 官方托管，免运维 | 快速上线、无基础设施负担 |

---

## 二、实战：用 LangChain 构建第一个 Agent

### 2.1 环境设置

```bash
pip install langchain openai duckduckgo-search
```

### 2.2 基础 Agent 实现

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI

# 定义工具
tools = [
    Tool(
        name="Search",
        func=DuckDuckGoSearchRun().run,
        description="用于搜索最新信息"
    )
]

# 初始化Agent
agent = initialize_agent(
    tools,
    OpenAI(temperature=0),
    agent="zero-shot-react-description",
    verbose=True
)

# 运行Agent
agent.run("2026年最热门的AI技术趋势是什么？")
```

### 2.3 添加记忆功能

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(memory_key="chat_history")

agent = initialize_agent(
    tools,
    OpenAI(temperature=0),
    agent="conversational-react-description",
    memory=memory,
    verbose=True
)

# 多轮对话
agent.run("帮我搜索最新的AI新闻")
agent.run("总结一下刚才搜索到的内容")  # Agent 能记住上文
```

---

## 三、进阶：自定义工具

### 3.1 创建自定义工具

```python
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    city: str = Field(description="城市名称，如：北京、上海")

class WeatherTool(BaseTool):
    name = "weather"
    description = "获取指定城市的当前天气"
    args_schema = WeatherInput

    def _run(self, city: str) -> str:
        # 接入真实天气API
        mock_data = {
            "北京": "晴，28°C",
            "上海": "多云，32°C",
            "深圳": "阵雨，30°C",
        }
        return mock_data.get(city, f"{city} 天气数据不可用")

    async def _arun(self, city: str):
        return self._run(city)

# 使用自定义工具
tools = [WeatherTool()]
agent = initialize_agent(
    tools, OpenAI(temperature=0), agent="zero-shot-react-description"
)
agent.run("北京今天天气怎么样？")
```

### 3.2 工具链组合

```python
# 多个工具串联：搜索 → 总结 → 翻译
from langchain.chains import SimpleSequentialChain
from langchain.prompts import PromptTemplate

# 工具1：搜索
search_tool = Tool(
    name="Search",
    func=DuckDuckGoSearchRun().run,
    description="搜索信息"
)

# 工具2：总结（用LLM）
summarize_prompt = PromptTemplate(
    input_variables=["text"],
    template="请用一句话总结以下内容：\n{text}"
)
summarizer = LLMChain(llm=OpenAI(), prompt=summarize_prompt)

# 串联执行
chain = SimpleSequentialChain(chains=[search_tool, summarizer])
result = chain.run("2026年AI Agent发展趋势")
```

---

## 四、多 Agent 协作（CrewAI）

```python
from crewai import Agent, Task, Crew

# 定义角色
researcher = Agent(
    role="研究员",
    goal="搜集关于AI Agent的最新技术",
    backstory="你是一名专业的AI技术研究员",
    verbose=True
)

writer = Agent(
    role="技术作家",
    goal="将研究结果整理成易懂的教程",
    backstory="你是一名经验丰富的技术作家",
    verbose=True
)

# 定义任务
research_task = Task(
    description="研究2026年AI Agent开发的主流框架和技术趋势",
    agent=researcher
)

write_task = Task(
    description="根据研究结果，写一篇2000字的入门教程",
    agent=writer
)

# 组建团队并执行
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    verbose=True
)

result = crew.kickoff()
print(result)
```

---

## 五、最佳实践

### ✅ 推荐做法

1. **安全优先**：限制 Agent 权限，避免执行危险操作（如删除文件、发送邮件给陌生人）
2. **错误处理**：添加重试机制和异常捕获，避免 Agent 因单次失败而中断
3. **成本控制**：监控 API 调用次数和 tokens 使用，设置预算上限
4. **人类介入**：关键操作（如支付、删除数据）设置人工确认环节
5. **日志记录**：详细记录 Agent 的每一步思考和行动，便于调试

### ❌ 常见坑

1. **工具描述不清晰**：Agent 依赖工具描述来决定是否调用，描述模糊会导致误调用
2. **无限循环**：Agent 可能陷入重复调用同一工具的死循环，需设置最大步数限制
3. **上下文溢出**：长期对话 + 大量工具调用会导致上下文超限，需定期压缩记忆
4. **过度依赖 LLM**：关键决策（如金融交易）应有确定性的规则兜底，不能完全交给 LLM

---

## 六、进阶方向

### 6.1 多 Agent 协作系统

- **CrewAI**：角色分工，适合团队协作场景
- **AutoGen**（微软）：双向对话，适合代码生成和调试
- **MetaGPT**：模拟软件公司流程，自动完成需求→设计→编码→测试

### 6.2 Agent 自我改进

- **反思机制**：Agent 执行后自我评估，发现错误并修正
- **经验积累**：将成功/失败案例存入记忆，避免重复犯错
- **元认知**：Agent 学会"思考自己的思考过程"，动态调整策略

### 6.3 企业级 Agent 部署

- **安全隔离**：Agent 运行在沙箱环境中，限制文件和网络访问
- **审计追踪**：记录所有决策和操作，满足合规要求
- **多租户管理**：为不同用户/部门提供独立的 Agent 实例

---

## 七、总结

AI Agent 是 2026 年最具潜力的 AI 应用，掌握其开发技能将为你带来竞争优势。

**核心要点**：
1. **从简单开始**：先构建单 Agent + 少量工具，验证可行性后再扩展
2. **工具设计是关键**：工具的描述、输入输出格式直接决定 Agent 的效果
3. **安全永远优先**：Agent 的自主性是一把双刃剑，必须有约束机制

> 推荐进一步阅读：
> - [LangChain 官方文档](https://python.langchain.com/)
> - [CrewAI 官方文档](https://docs.crewai.com/)
> - [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)
> - [AutoGen 官方文档](https://microsoft.github.io/autogen/)

---

**更新时间**: 2026年5月31日
**适用对象**: AI开发者、对Agent开发感兴趣的程序员
