# AI Agent 开发实战教程

## 目录
1. AI Agent 概述
2. 核心技术架构
3. 开发框架选型
4. 实战案例：个人助理Agent
5. 多Agent协作系统
6. 部署与优化

## 1. AI Agent 概述

### 1.1 什么是 AI Agent？

**AI Agent（智能体）** 是能够：
- **感知环境**: 通过API、传感器获取信息
- **自主决策**: 基于大模型和工具调用规划行动
- **执行动作**: 调用工具、API、控制设备
- **学习改进**: 从反馈中优化策略

**与传统AI的区别**:
| 特性 | 传统AI | AI Agent |
|------|--------|----------|
| 交互方式 | 单轮对话 | 多轮任务执行 |
| 能力边界 | 仅文本生成 | 调用工具、执行动作 |
| 自主性 | 被动响应 | 主动规划 |
| 记忆 | 无持久记忆 | 长期记忆+经验学习 |

### 1.2 为什么 AI Agent 是2026年最热风口？

**市场数据**:
- **融资规模**: 2026年Q1 AI Agent赛道融资超50亿美元
- **企业采用率**: 财富500强中62%正在试点AI Agent
- **开源社区**: LangChain、AutoGPT等项目GitHub星标超10万

**核心驱动力**:
1. **大模型成熟**: GPT-4、Claude 3、Gemini 1.5 具备强大推理能力
2. **工具生态丰富**: 数千个API和工具可供调用
3. **降低人力成本**: Agent可自动化大量知识工作

### 1.3 典型应用场景

**场景1: 客户服务Agent**
```
用户: "我的订单什么时候到？"
Agent:
  1. 调用订单查询API → 订单号#12345
  2. 调用物流查询API → 预计明天送达
  3. 回复用户: "您的订单#12345预计明天送达"
```

**场景2: 代码助手Agent**
```
用户: "帮我修复这个bug"
Agent:
  1. 读取代码文件
  2. 分析错误日志
  3. 定位问题代码
  4. 生成修复方案
  5. 创建Pull Request
```

**场景3: 研究助手Agent**
```
用户: "总结一下Transformer论文"
Agent:
  1. 在arXiv搜索"Attention is All You Need"
  2. 下载PDF
  3. 提取文本内容
  4. 生成摘要
  5. 制作PPT
```

## 2. 核心技术架构

### 2.1 AI Agent 技术栈

```
┌─────────────────────────────────────┐
│        用户交互层 (UI/API)          │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Agent 编排层 (Orchestration)  │
│  • 任务规划 (Planning)             │
│  • 工具调用 (Tool Calling)         │
│  • 记忆管理 (Memory)               │
│  • 反思优化 (Reflection)           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       大模型层 (LLM Backend)        │
│  • GPT-4 / Claude 3 / Gemini       │
│  • Function Calling 能力            │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         工具层 (Tools)              │
│  • 搜索引擎  • 数据库              │
│  • 代码执行  • API调用             │
│  • 文件操作  • 浏览器自动化        │
└─────────────────────────────────────┘
```

### 2.2 关键模块详解

#### 模块1: 任务规划 (Planning)

**目标**: 将复杂任务分解为可执行的子任务

**技术实现**:
```python
class TaskPlanner:
    def __init__(self, llm):
        self.llm = llm
    
    def plan(self, user_request: str) -> List[Task]:
        """将用户请求分解为任务列表"""
        prompt = f"""
        用户请求: {user_request}
        
        请将其分解为一系列子任务，每个子任务应包含：
        1. 任务描述
        2. 所需工具
        3. 依赖关系
        
        输出JSON格式：
        [
            {{"task": "...", "tools": [...], "depends_on": [...]}},
            ...
        ]
        """
        
        response = self.llm.generate(prompt)
        tasks = json.loads(response)
        
        return [Task(**t) for t in tasks]
```

**示例**:
```
用户请求: "帮我分析竞品并写一份报告"
↓
任务分解:
  1. 搜索竞品信息 (工具: Google Search)
  2. 抓取竞品官网 (工具: Web Scraper)
  3. 提取关键信息 (工具: LLM)
  4. 生成报告 (工具: Document Generator)
  5. 制作PPT (工具: PPT Generator)
```

#### 模块2: 工具调用 (Tool Calling)

**目标**: 让Agent能够调用外部工具和API

**实现方式1: OpenAI Function Calling**
```python
import openai

# 定义工具
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        }
    }
]

# 调用LLM（带工具）
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=tools,
    tool_choice="auto"
)

# 解析工具调用
message = response.choices[0].message
if message.tool_calls:
    tool_call = message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    
    # 执行工具
    if function_name == "get_weather":
        result = get_weather(arguments["city"])
        
        # 将结果返回给LLM
        messages.append(message)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": result
        })
        
        final_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )
```

**实现方式2: ReAct框架 (Reasoning + Acting)**
```python
class ReActAgent:
    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
    
    def run(self, task: str):
        """ReAct循环: Reason → Act → Observe"""
        max_iterations = 10
        context = f"Task: {task}\n\n"
        
        for i in range(max_iterations):
            # 1. Reason (推理)
            prompt = f"{context}\nThought: "
            thought = self.llm.generate(prompt)
            context += f"Thought: {thought}\n"
            
            # 2. Act (行动)
            action_prompt = f"{context}\nAction: "
            action_text = self.llm.generate(action_prompt)
            context += f"Action: {action_text}\n"
            
            # 解析行动（格式: Action: tool_name(input)）
            tool_name, tool_input = self.parse_action(action_text)
            
            if tool_name == "FINISH":
                return tool_input  # 返回最终结果
            
            # 3. Observe (观察)
            if tool_name in self.tools:
                tool = self.tools[tool_name]
                observation = tool.execute(tool_input)
                context += f"Observation: {observation}\n\n"
            else:
                context += f"Observation: Error - Unknown tool {tool_name}\n\n"
        
        return "Task failed - max iterations reached"
```

#### 模块3: 记忆管理 (Memory)

**目标**: 让Agent具备长期记忆和上下文理解能力

**记忆类型**:
1. **短期记忆** (Short-term): 当前对话上下文（LLM的context window）
2. **长期记忆** (Long-term): 向量数据库存储的历史信息
3. **工作记忆** (Working): 当前任务的临时变量和状态

**实现示例**:
```python
class AgentMemory:
    def __init__(self):
        # 短期记忆：最近10轮对话
        self.short_term = deque(maxlen=10)
        
        # 长期记忆：向量数据库
        self.long_term = VectorDB("agent_memory")
        
        # 工作记忆：当前任务状态
        self.working_memory = {{}}
    
    def add(self, role: str, content: str):
        """添加记忆"""
        # 1. 短期记忆
        self.short_term.append({{"role": role, "content": content}})
        
        # 2. 长期记忆（异步写入）
        self.long_term.add(
            text=content,
            metadata={{"role": role, "timestamp": time.time()}}
        )
    
    def retrieve(self, query: str, top_k: int = 5):
        """检索相关记忆"""
        # 1. 短期记忆：直接返回
        recent = list(self.short_term)
        
        # 2. 长期记忆：向量检索
        relevant = self.long_term.search(query, top_k=top_k)
        
        return recent, relevant
    
    def get_context(self, query: str):
        """构建LLM上下文"""
        recent, relevant = self.retrieve(query)
        
        context = "## 相关历史记忆:\n"
        for mem in relevant:
            context += f"- {mem['text']}\n"
        
        context += "\n## 最近对话:\n"
        for msg in recent:
            context += f"{msg['role']}: {msg['content']}\n"
        
        return context
```

#### 模块4: 反思优化 (Reflection)

**目标**: 让Agent从错误中学习，自我改进

**实现方式**:
```python
class ReflectiveAgent:
    def __init__(self, llm):
        self.llm = llm
        self.memory = []
    
    def execute_task(self, task: str):
        """执行任务（带反思）"""
        max_retries = 3
        
        for attempt in range(max_retries):
            # 1. 执行任务
            result = self.try_task(task)
            
            # 2. 反思
            reflection = self.reflect(task, result)
            
            if reflection['success']:
                return result
            else:
                # 3. 改进策略
                improved_strategy = reflection['improved_strategy']
                self.update_strategy(improved_strategy)
                
                print(f"重试 {attempt+1}/{max_retries}: {reflection['error']}")
        
        return "Task failed after max retries"
    
    def reflect(self, task: str, result: str):
        """反思执行结果"""
        prompt = f"""
        任务: {task}
        执行结果: {result}
        
        请分析:
        1. 任务是否成功完成？
        2. 如果失败，原因是什么？
        3. 如何改进策略？
        
        输出JSON格式：
        {{
            "success": true/false,
            "error": "错误描述（如果失败）",
            "improved_strategy": "改进策略"
        }}
        """
        
        response = self.llm.generate(prompt)
        return json.loads(response)
```

## 3. 开发框架选型

### 3.1 主流框架对比

| 框架 |  starred | 优势 | 劣势 | 适用场景 |
|------|----------|------|------|----------|
| **LangChain** | 85k+ | 生态丰富、文档完善 | 抽象层次高、性能一般 | 快速原型开发 |
| **LlamaIndex** | 35k+ | 数据处理强、RAG优化 | Agent能力较弱 | 知识库问答 |
| **AutoGPT** | 168k+ | 自主性强、社区活跃 | 不稳定、成本高 | 研究实验 |
| **CrewAI** | 18k+ | 多Agent协作、角色分工 | 较新、生态待完善 | 复杂任务编排 |
| **Semantic Kernel** | 17k+ | 微软官方、.NET友好 | 相对年轻 | 企业.NET项目 |

### 3.2 LangChain 实战

#### 安装与基础使用
```bash
pip install langchain langchain-openai
```

```python
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate

# 1. 定义工具
def search_tool(query: str) -> str:
    """搜索工具"""
    # 调用搜索API
    return f"搜索结果: {query} ..."

def calculator_tool(expression: str) -> str:
    """计算器工具"""
    result = eval(expression)
    return str(result)

tools = [
    Tool(name="Search", func=search_tool, description="搜索互联网"),
    Tool(name="Calculator", func=calculator_tool, description="计算数学表达式")
]

# 2. 创建LLM
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 3. 创建Agent
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有用的AI助手，可以使用工具完成任务。"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_openai_functions_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 4. 运行Agent
result = executor.invoke({{"input": "今天北京天气怎么样？算一下15*37"}})
print(result['output'])
```

#### 高级功能：记忆与状态
```python
from langchain.memory import ConversationBufferMemory

# 添加记忆
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# 多轮对话
executor.invoke({{"input": "我叫小明"}})
executor.invoke({{"input": "我叫什么名字？"}})  # Agent会记住"小明"
```

### 3.3 CrewAI 实战（多Agent协作）

```bash
pip install crewai
```

```python
from crewai import Agent, Task, Crew

# 1. 定义Agent（角色）
researcher = Agent(
    role='研究员',
    goal='深入研究给定话题',
    backstory='你是一个经验丰富的研究员，擅长信息收集和分析。',
    tools=[search_tool, web_scraper_tool]
)

writer = Agent(
    role='作家',
    goal='将研究结果写成高质量文章',
    backstory='你是一个优秀的作家，擅长将复杂信息转化为易懂的文章。',
    tools=[document_generator_tool]
)

# 2. 定义任务
research_task = Task(
    description='研究"AI Agent发展趋势"，收集最新信息和数据。',
    agent=researcher,
    expected_output='一份详细的研究报告，包含数据、案例和趋势分析。'
)

writing_task = Task(
    description='基于研究报告，写一篇1500字的科普文章。',
    agent=writer,
    expected_output='一篇结构清晰、语言生动的科普文章。',
    context=[research_task]  # 依赖前一个任务
)

# 3. 创建Crew（团队）
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential  # 顺序执行
)

# 4. 启动！
result = crew.kickoff()
print(result)
```

## 4. 实战案例：个人助理Agent

### 4.1 需求分析

**功能列表**:
- ✅ 日程管理（查询、添加、删除日程）
- ✅ 邮件处理（读取、回复、分类）
- ✅ 信息查询（天气、新闻、搜索）
- ✅ 提醒服务（定时提醒）
- ✅ 文件管理（搜索、整理）

### 4.2 系统架构

```
┌─────────────────────────────────┐
│          用户界面 (Web/App)      │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│        PersonalAgent 主控制器    │
│  • 意图识别                     │
│  • 任务规划                     │
│  • 工具编排                     │
└─────────────────────────────────┘
                ↓
    ┌───────────┬───────────┬───────────┐
    ↓           ↓           ↓           ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│日历工具│ │邮件工具│ │搜索工具│ │文件工具│
└────────┘ └────────┘ └────────┘ └────────┘
```

### 4.3 代码实现

#### 完整代码
```python
import openai
from datetime import datetime
import json

class PersonalAssistantAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.tools = self._define_tools()
        self.conversation_history = []
    
    def _define_tools(self):
        """定义可用工具"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_calendar",
                    "description": "查询日程安排",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string", "description": "日期 (YYYY-MM-DD)"}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "add_calendar_event",
                    "description": "添加日程事件",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "事件标题"},
                            "date": {"type": "string", "description": "日期 (YYYY-MM-DD)"},
                            "time": {"type": "string", "description": "时间 (HH:MM)"},
                            "description": {"type": "string", "description": "事件描述"}
                        },
                        "required": ["title", "date", "time"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_web",
                    "description": "搜索互联网信息",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "搜索关键词"}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "查询天气",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "city": {"type": "string", "description": "城市名称"}
                        },
                        "required": ["city"]
                    }
                }
            }
        ]
    
    def _execute_tool(self, tool_name: str, arguments: dict):
        """执行工具调用"""
        if tool_name == "get_calendar":
            return self._get_calendar(arguments.get("date"))
        
        elif tool_name == "add_calendar_event":
            return self._add_calendar_event(
                title=arguments["title"],
                date=arguments["date"],
                time=arguments["time"],
                description=arguments.get("description", "")
            )
        
        elif tool_name == "search_web":
            return self._search_web(arguments["query"])
        
        elif tool_name == "get_weather":
            return self._get_weather(arguments["city"])
        
        else:
            return f"未知工具: {tool_name}"
    
    def _get_calendar(self, date: str = None):
        """查询日程（模拟）"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        # 模拟数据库查询
        events = [
            {"title": "团队会议", "time": "10:00", "description": "每周例会"},
            {"title": "项目评审", "time": "14:00", "description": "Q2项目评审"}
        ]
        
        return json.dumps(events, ensure_ascii=False)
    
    def _add_calendar_event(self, title: str, date: str, time: str, description: str = ""):
        """添加日程（模拟）"""
        # 模拟数据库写入
        event = {
            "title": title,
            "date": date,
            "time": time,
            "description": description
        }
        
        # 保存到数据库（模拟）
        print(f"已添加日程: {event}")
        
        return f"成功添加日程: {title} ({date} {time})"
    
    def _search_web(self, query: str):
        """搜索互联网（模拟）"""
        # 实际应调用搜索API（如Google Custom Search）
        return f"搜索'{query}'的结果：\n1. 相关链接1\n2. 相关链接2\n3. 相关链接3"
    
    def _get_weather(self, city: str):
        """查询天气（模拟）"""
        # 实际应调用天气API（如OpenWeatherMap）
        return f"{city}今天：晴，20-28°C"
    
    def chat(self, user_input: str):
        """与用户对话"""
        # 1. 添加用户消息到历史
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        
        # 2. 调用LLM（带工具）
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=self.conversation_history,
            tools=self.tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        
        # 3. 处理工具调用
        if message.tool_calls:
            # 添加助手消息到历史
            self.conversation_history.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": message.tool_calls
            })
            
            # 执行每个工具调用
            for tool_call in message.tool_calls:
                function_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)
                
                print(f"🔧 调用工具: {function_name}({arguments})")
                
                # 执行工具
                result = self._execute_tool(function_name, arguments)
                
                # 添加工具结果到历史
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })
            
            # 4. 将工具结果返回给LLM，获取最终回复
            final_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=self.conversation_history
            )
            
            final_message = final_response.choices[0].message.content
            
            # 添加最终回复到历史
            self.conversation_history.append({
                "role": "assistant",
                "content": final_message
            })
            
            return final_message
        
        else:
            # 无需工具调用，直接回复
            self.conversation_history.append({
                "role": "assistant",
                "content": message.content
            })
            
            return message.content
    
    def run(self):
        """运行Agent（交互式）"""
        print("🤖 个人助理Agent已启动！输入'exit'退出。\n")
        
        while True:
            user_input = input("👤 你: ")
            
            if user_input.lower() == 'exit':
                print("👋 再见！")
                break
            
            response = self.chat(user_input)
            print(f"🤖 Agent: {response}\n")

# 使用示例
if __name__ == "__main__":
    agent = PersonalAssistantAgent(openai_api_key="your-api-key")
    agent.run()
```

### 4.4 运行示例

```
🤖 个人助理Agent已启动！输入'exit'退出。

👤 你: 你好！
🤖 Agent: 你好！我是你的个人助理。我可以帮你管理日程、查询天气、搜索信息等。有什么可以帮你的吗？

👤 你: 明天有什么安排？
🔧 调用工具: get_calendar({'date': '2026-05-27'})
🤖 Agent: 明天（2026-05-27）的日程安排如下：
1. 团队会议 - 10:00
2. 项目评审 - 14:00

👤 你: 帮我在明天下午3点添加一个会议，标题是"客户演示"
🔧 调用工具: add_calendar_event({'title': '客户演示', 'date': '2026-05-27', 'time': '15:00', 'description': ''})
🤖 Agent: 好的！已成功添加日程：客户演示 (2026-05-27 15:00)

👤 你: 北京今天天气怎么样？
🔧 调用工具: get_weather({'city': '北京'})
🤖 Agent: 北京今天：晴，20-28°C。是个出门的好天气！

👤 你: exit
👋 再见！
```

## 5. 多Agent协作系统

### 5.1 为什么需要多Agent？

**单Agent的局限**:
- 任务复杂度高时，单Agent容易"迷失方向"
- 无法同时处理多个独立任务
- 缺乏专业分工

**多Agent的优势**:
- **专业分工**: 每个Agent专注于特定领域
- **并行处理**: 多个Agent同时工作
- **可扩展性**: 轻松添加新的Agent

### 5.2 协作模式

#### 模式1: 顺序协作 (Sequential)
```
任务: "研究并总结AI Agent"
  ↓
研究员Agent → 作家Agent → 编辑Agent
  ↓            ↓            ↓
研究数据      写文章        润色校对
```

#### 模式2: 并行协作 (Parallel)
```
任务: "分析竞品"
  ↓
市场分析Agent  ┐
技术分析Agent  ├→ 汇总Agent → 最终报告
用户分析Agent  ┘
```

#### 模式3: 辩论协作 (Debate)
```
任务: "决定是否投资某项目"
  ↓
乐观Agent → 辩论 → 裁判Agent → 最终决策
  ↓          ↓         ↓
支持论点    反对论点   综合判断
```

### 5.3 实战：研究团队多Agent系统

```python
from crewai import Agent, Task, Crew, Process

# 1. 定义Agent
research_lead = Agent(
    role='研究主管',
    goal='协调整个研究流程',
    backstory='你是一个经验丰富的研究团队主管，擅长任务分配和质量控制。',
    allow_delegation=True  # 允许委派任务
)

data_collector = Agent(
    role='数据收集员',
    goal='从各种来源收集准确数据',
    backstory='你是一个细致的数据收集专家，擅长使用各种工具获取信息。',
    tools=[search_tool, web_scraper_tool, database_query_tool]
)

data_analyst = Agent(
    role='数据分析师',
    goal='从数据中提取有价值的洞察',
    backstory='你是一个专业的数据分析师，擅长统计分析和数据可视化。',
    tools=[python_repl_tool, visualization_tool]
)

report_writer = Agent(
    role='报告撰写人',
    goal='将分析结果写成清晰易懂的报告',
    backstory='你是一个优秀的报告撰写人，擅长将复杂数据转化为易懂的叙述。',
    tools=[document_generator_tool, chart_generator_tool]
)

# 2. 定义任务
collect_data = Task(
    description='收集关于"{topic}"的数据，包括市场规模、主要玩家、技术趋势等。',
    agent=data_collector,
    expected_output='一份结构化的数据文档，包含数值、来源和日期。'
)

analyze_data = Task(
    description='分析收集到的数据，识别趋势、模式和洞察。',
    agent=data_analyst,
    expected_output='一份数据分析报告，包含统计结果、图表和关键发现。',
    context=[collect_data]
)

write_report = Task(
    description='基于数据分析，撰写一份1500字的研究报告。',
    agent=report_writer,
    expected_output='一份完整的研究报告，包含摘要、正文、结论和建议。',
    context=[collect_data, analyze_data]
)

# 3. 创建Crew
research_crew = Crew(
    agents=[research_lead, data_collector, data_analyst, report_writer],
    tasks=[collect_data, analyze_data, write_report],
    process=Process.sequential,
    verbose=True
)

# 4. 启动！
result = research_crew.kickoff(inputs={"topic": "AI Agent发展趋势"})
print(result)
```

## 6. 部署与优化

### 6.1 部署架构

#### 架构1: 单机部署（开发/测试）
```
┌──────────────────┐
│   Agent Process   │
│  (Python脚本)     │
└──────────────────┘
        ↓
┌──────────────────┐
│   LLM API        │  (OpenAI/Anthropic)
└──────────────────┘
        ↓
┌──────────────────┐
│   Vector DB      │  (ChromaDB/Qdrant)
└──────────────────┘
```

#### 架构2: 分布式部署（生产）
```
┌─────────────────────────────────────┐
│         负载均衡 (Nginx)            │
└─────────────────────────────────────┘
         ↓          ↓          ↓
┌────────┐  ┌────────┐  ┌────────┐
│Agent 1 │  │Agent 2 │  │Agent 3 │  (多个Agent实例)
└────────┘  └────────┘  └────────┘
         ↓          ↓          ↓
┌─────────────────────────────────────┐
│         Redis (任务队列)            │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│      LLM API (带速率限制)          │
└─────────────────────────────────────┘
```

### 6.2 性能优化

#### 优化1: 缓存LLM响应
```python
from functools import lru_cache
import hashlib

class CachedLLM:
    def __init__(self, llm):
        self.llm = llm
        self.cache = {{}}
    
    def generate(self, prompt: str, **kwargs):
        """带缓存的文本生成"""
        # 计算缓存key
        cache_key = self._get_cache_key(prompt, kwargs)
        
        # 检查缓存
        if cache_key in self.cache:
            print("✅ 缓存命中")
            return self.cache[cache_key]
        
        # 调用LLM
        result = self.llm.generate(prompt, **kwargs)
        
        # 存入缓存
        self.cache[cache_key] = result
        
        return result
    
    def _get_cache_key(self, prompt: str, kwargs: dict):
        """生成缓存key"""
        content = f"{prompt}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(content.encode()).hexdigest()
```

#### 优化2: 并行工具调用
```python
from concurrent.futures import ThreadPoolExecutor

class ParallelToolExecutor:
    def __init__(self, max_workers: int = 5):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def execute_tools(self, tool_calls: List[dict]):
        """并行执行多个工具调用"""
        futures = []
        
        for tool_call in tool_calls:
            future = self.executor.submit(
                self._execute_single_tool,
                tool_call
            )
            futures.append(future)
        
        # 等待所有工具执行完成
        results = [f.result() for f in futures]
        
        return results
    
    def _execute_single_tool(self, tool_call: dict):
        """执行单个工具"""
        function_name = tool_call['function']['name']
        arguments = json.loads(tool_call['function']['arguments'])
        
        # 执行工具
        result = execute_tool(function_name, arguments)
        
        return {
            'tool_call_id': tool_call['id'],
            'result': result
        }
```

#### 优化3: 降低LLM调用成本
```python
class CostOptimizedAgent:
    def __init__(self, llm):
        self.llm = llm
        self.simple_tasks = ["打招呼", "简单计算", "查询时间"]
    
    def should_use_llm(self, task: str) -> bool:
        """判断是否需要调用LLM"""
        # 简单任务不使用LLM
        for simple in self.simple_tasks:
            if simple in task:
                return False
        
        return True
    
    def execute(self, task: str):
        """执行任务（带成本优化）"""
        if not self.should_use_llm(task):
            # 使用规则引擎处理
            return self._rule_based_response(task)
        
        # 调用LLM
        return self.llm.generate(task)
    
    def _rule_based_response(self, task: str):
        """基于规则的响应（无需LLM）"""
        if "你好" in task or "hi" in task.lower():
            return "你好！我是AI助理。"
        
        elif "时间" in task:
            return f"现在是 {datetime.now().strftime('%H:%M:%S')}"
        
        elif "计算" in task:
            # 提取数学表达式
            expression = extract_expression(task)
            result = eval(expression)
            return str(result)
```

### 6.3 监控与调试

#### 日志记录
```python
import logging

class LoggingAgent:
    def __init__(self):
        # 配置日志
        logging.basicConfig(
            filename='agent.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def chat(self, user_input: str):
        """带日志的记录"""
        self.logger.info(f"用户输入: {user_input}")
        
        try:
            # 调用LLM
            response = self.llm.generate(user_input)
            self.logger.info(f"LLM响应: {response}")
            
            # 调用工具
            if self._has_tool_calls(response):
                tool_results = self._execute_tools(response)
                self.logger.info(f"工具调用结果: {tool_results}")
                
                final_response = self._get_final_response(tool_results)
                self.logger.info(f"最终响应: {final_response}")
                
                return final_response
            
            return response
        
        except Exception as e:
            self.logger.error(f"错误: {str(e)}", exc_info=True)
            return "抱歉，发生了错误。"
```

#### 性能监控
```python
import time
from dataclasses import dataclass

@dataclass
class AgentMetrics:
    total_calls: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    total_time: float = 0.0
    tool_calls: int = 0

class MonitoredAgent:
    def __init__(self):
        self.metrics = AgentMetrics()
    
    def chat(self, user_input: str):
        """带监控的对话"""
        start_time = time.time()
        
        # 调用LLM
        response = self.llm.generate(user_input)
        
        # 更新指标
        self.metrics.total_calls += 1
        self.metrics.total_tokens += response.usage['total_tokens']
        self.metrics.total_cost += self._calculate_cost(response.usage)
        self.metrics.total_time += time.time() - start_time
        
        if self._has_tool_calls(response):
            self.metrics.tool_calls += len(response.tool_calls)
        
        return response
    
    def get_metrics(self):
        """获取性能指标"""
        return {
            "总调用次数": self.metrics.total_calls,
            "总Token消耗": self.metrics.total_tokens,
            "总成本 (USD)": self.metrics.total_cost,
            "总耗时 (秒)": self.metrics.total_time,
            "平均响应时间 (秒)": self.metrics.total_time / self.metrics.total_calls,
            "工具调用次数": self.metrics.tool_calls
        }
```

## 7. 总结

AI Agent是2026年AI领域最热门的方向，它让大模型从"聊天机器人"进化成"自主执行任务的智能体"。

**关键要点**:
1. **技术栈**: Planning + Tool Calling + Memory + Reflection
2. **框架选择**: LangChain（快速原型）、CrewAI（多Agent协作）
3. **实战核心**: 工具定义、任务规划、记忆管理
4. **部署优化**: 缓存、并行、成本优化

**下一步行动**:
- 用LangChain搭建第一个Agent
- 尝试CrewAI实现多Agent协作
- 在实际项目中应用Agent自动化任务

---

**参考资料**:
- LangChain官方文档: https://docs.langchain.com/
- CrewAI GitHub: https://github.com/joaomdmiranda/crewAI
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- "React: Synergizing Reasoning and Acting in Language Models" (论文)

**教程版本**: v1.0 (2026-05-26)
**作者**: QClaw AI Assistant
