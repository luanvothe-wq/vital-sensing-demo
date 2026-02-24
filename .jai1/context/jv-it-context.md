# JV-IT TECHS Context

JV-IT TECHS là một công ty phát triển phần mềm tại Việt Nam, chuyên phát triển phần mềm Offshore cho Nhật Bản

## Size
Công ty khoảng 100 người, được chia thành nhiều labs nhỏ từ 2 -> 15 người bao gồm cả PM, Leader, Developer, QC

## Goal
- Áp dụng Agentic Coding, AI-First với việc tận dụng `jai1 framework` và nhiều kiến thức khác.

## Technical Stack

### Backend Frameworks
Core frameworks for building server-side logic and APIs.

| Technology | Details |
|------------|---------|
| **Laravel** (v12) | A PHP framework known for its elegant syntax and robust features for web application development. |
| **NestJS** (v11) | A progressive Node.js framework for building efficient, reliable and scalable server-side applications with TypeScript. |
| **CakePHP** (v5) | An open-source web framework for PHP, following the model-view-controller (MVC) approach for rapid development. |
| **ExpressJS** (v5) | A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. |
| **Hono** (v4) | An ultrafast, lightweight web framework for the Edge. Works on Cloudflare Workers, Deno, Bun, and Node.js with zero dependencies. |

### Frontend Frameworks
Frameworks for building user interfaces and client-side applications.

| Technology | Details |
|------------|---------|
| **Next.js** (v16) | A React framework for production-grade applications, featuring server-side rendering and static site generation. |
| **Nuxt.js** (v4) | An intuitive Vue framework for creating universal or single-page Vue.js applications with ease. |

### UI/CSS Stack
Technologies for styling and building user interfaces.

| Technology | Details |
|------------|---------|
| **Tailwind CSS** (v4) | A utility-first CSS framework for rapidly building custom designs. |
| **shadcn/ui + Radix UI** (v0) | A collection of re-usable components for Next.js/React, built on top of Radix UI for accessibility. |
| **Nuxt UI** (v4) | A UI library specifically designed for Nuxt.js projects, offering a set of ready-to-use components. |
| **Lucide React** (v0) | The default icon library for React-based projects, providing a wide range of clean and consistent icons. |

### Databases
Relational database management systems for data storage.

| Technology | Details |
|------------|---------|
| **MySQL** (v9) | A widely-used open-source relational database management system. |
| **PostgreSQL** (v18) | A powerful, open-source object-relational database system with a strong reputation for reliability. |
| **MSSQL** (SQL Server 2022) | Microsoft SQL Server, a relational database management system developed by Microsoft. |

### Caching
In-memory data store used for caching and message brokering.

| Technology | Details |
|------------|---------|
| **Redis** (v8) | An open-source, in-memory data structure store, used as a database, cache, and message broker. |
| **Valkey** (v9) | A high-performance key/value datastore, originally a fork of Redis, designed for speed and scalability. |

### Mobile Development
Framework for building natively compiled, multi-platform applications from a single codebase.

| Technology | Details |
|------------|---------|
| **Flutter** (v3) | Google's UI toolkit for building beautiful, natively compiled applications for mobile, web, and desktop from a single codebase. |

### Date/Time Library
Preferred libraries for handling dates and times.

| Technology | Details |
|------------|---------|
| **Day.js** (v1) | A fast, lightweight, and minimalist JavaScript library for parsing, validating, manipulating, and displaying dates and times. |
| **date-fns** (v4) | A modern JavaScript date utility library providing comprehensive, yet simple and consistent toolset for manipulating dates. |

### Code Management
Tools and strategies for version control and project organization.

| Technology | Details |
|------------|---------|
| **Git** (v2) | The standard distributed version control system for tracking changes in source code during software development. |
| **Monorepo** | A software development strategy where code for many projects is stored in the same repository. Preferred for full-stack Node.js projects. |

### IDE Agent Mode AI
IDEs that integrate with AI to provide agentic coding capabilities, enhancing the development workflow.

| Technology | Details |
|------------|---------|
| **Cursor** (v2) | An AI-first code editor designed for pair-programming with a powerful AI, helping to write, edit, and understand code. |
| **Windsurf** (v2) | An agentic IDE that helps developers with complex coding tasks through AI-powered workflows and deep project context understanding. |

### Cloud Infrastructure (AWS)
Basic AWS services used for hosting and infrastructure.

| Service | Usage |
|---------|---------|
| **EC2** | Virtual servers for hosting applications. |
| **ALB** | Application Load Balancer for distributing incoming traffic. |
| **S3** | Object storage for files, assets, and backups. |
| **SQS** | Simple Queue Service for message queuing. |
| **SES** | Simple Email Service for sending emails. |
| **CloudWatch** | Monitoring and observability for AWS resources. |
| **CloudFront** | CDN for content delivery and caching. |
| **Auto Scaling** | Automatic scaling of EC2 instances based on demand. |
| **Bastion Host** | Secure access point for SSH into private instances. |
| **API Gateway** | Managed service for creating and managing APIs. |

### Cloud Infrastructure (Cloudflare)
Cloudflare services for edge computing, CDN, and security.

| Service | Usage |
|---------|---------|
| **Cloudflare CDN** | Global content delivery network for caching and accelerating websites. |
| **Cloudflare Workers** | Serverless execution environment for running JavaScript/TypeScript at the edge. |
| **Cloudflare D1** | Serverless SQL database built on SQLite for edge applications. |
| **Cloudflare R2** | S3-compatible object storage with zero egress fees. |
| **Cloudflare KV** | Key-value storage for low-latency data access at the edge. |
| **Cloudflare Pages** | JAMstack platform for deploying static sites and full-stack applications. |

### Discord Bot Development
Framework for building Discord bots.

| Technology | Details |
|------------|---------|
| **Sapphire.js** (v5) | A next-gen Discord bot framework built on top of discord.js, featuring a plugin system, argument parsing, preconditions, and TypeScript support. |

### AI/ML Stack
AI and Machine Learning frameworks for building intelligent applications.

| Technology | Details |
|------------|---------|
| **LangChain (TypeScript)** (v1) | A framework for developing applications powered by language models, enabling chains, agents, and retrieval-augmented generation. |
| **LangGraph (TypeScript)** (v1) | A library for building stateful, multi-actor applications with LLMs, using graph-based workflows for complex agent orchestration. |
| **Mastra.ai** (v0) | An open-source TypeScript framework for building AI agents with workflows, RAG, integrations, and syncs. Designed for production-ready agentic applications. |

### Architecture
Software architecture patterns commonly used.

| Pattern | Details |
|---------|---------|
| **Monolithic** | Primary architecture pattern. Single deployable unit containing all application components. Simple to develop and deploy, suitable for most projects. |
| **MVC** | Model-View-Controller pattern used within frameworks (Laravel, CakePHP, NestJS). |
| **Modular** | Architecture that divides the system into independent modules, improving maintainability and scalability (NestJS, Laravel Modules). |

### CI/CD
Continuous Integration and Continuous Deployment practices.

| Status | Details |
|--------|---------|
| **Basic** | CI/CD implementation is minimal or nearly absent in most projects. Manual deployment processes are common. |

> ⚠️ **Improvement Area**: CI/CD automation is an area for potential improvement to enhance deployment reliability and speed.

### Testing
Testing practices and coverage.

| Type | Status |
|------|---------|
| **Unit Testing** | Very basic coverage. Most projects have minimal or no unit tests. |
| **Manual Testing** | Primary testing method. QC team performs manual testing for most features. |

> ⚠️ **Improvement Area**: Automated testing is an area for potential improvement to reduce bugs and increase code confidence.
