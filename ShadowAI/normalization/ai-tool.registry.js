"use strict";
/**
 * AI Tool Registry - Catalog of known AI tools/services with domains,
 * categories, and default risk classifications.
 *
 * This registry is used during event normalization to identify and classify
 * AI tool usage from raw security events (URLs, domains, user-agent strings, etc.).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_TOOL_REGISTRY = void 0;
exports.buildDomainLookup = buildDomainLookup;
exports.matchAITool = matchAITool;
exports.getToolsByCategory = getToolsByCategory;
exports.getHighRiskTools = getHighRiskTools;
/**
 * Registry of ~200 known AI tools, services, and platforms.
 * Organized by category for maintainability.
 */
exports.AI_TOOL_REGISTRY = [
    // === Generative AI / LLM Chatbots ===
    { name: "ChatGPT", domains: ["chat.openai.com", "chatgpt.com"], category: "generative_ai", default_risk: "high", vendor: "OpenAI", description: "General-purpose AI chatbot" },
    { name: "OpenAI API", domains: ["api.openai.com"], category: "generative_ai", default_risk: "high", vendor: "OpenAI", description: "OpenAI API platform" },
    { name: "OpenAI Platform", domains: ["platform.openai.com"], category: "generative_ai", default_risk: "high", vendor: "OpenAI", description: "OpenAI developer platform" },
    { name: "Claude", domains: ["claude.ai", "api.anthropic.com"], category: "generative_ai", default_risk: "high", vendor: "Anthropic", description: "Anthropic AI assistant" },
    { name: "Gemini", domains: ["gemini.google.com", "generativelanguage.googleapis.com", "aistudio.google.com"], category: "generative_ai", default_risk: "high", vendor: "Google", description: "Google Gemini AI" },
    { name: "Google Bard", domains: ["bard.google.com"], category: "generative_ai", default_risk: "high", vendor: "Google", description: "Google Bard (legacy)" },
    { name: "Microsoft Copilot", domains: ["copilot.microsoft.com", "copilot.cloud.microsoft"], category: "generative_ai", default_risk: "medium", vendor: "Microsoft", description: "Microsoft Copilot assistant" },
    { name: "Bing Chat", domains: ["www.bing.com/chat"], category: "generative_ai", default_risk: "medium", vendor: "Microsoft", description: "Bing AI Chat" },
    { name: "Perplexity", domains: ["perplexity.ai", "www.perplexity.ai", "api.perplexity.ai"], category: "search_ai", default_risk: "medium", vendor: "Perplexity AI", description: "AI-powered search engine" },
    { name: "Poe", domains: ["poe.com"], category: "generative_ai", default_risk: "medium", vendor: "Quora", description: "Multi-model AI chatbot platform" },
    { name: "Character.AI", domains: ["character.ai", "beta.character.ai"], category: "chatbot", default_risk: "low", vendor: "Character.AI", description: "AI character chatbot" },
    { name: "Pi AI", domains: ["pi.ai", "heypi.com"], category: "chatbot", default_risk: "low", vendor: "Inflection AI", description: "Personal AI assistant" },
    { name: "Grok", domains: ["grok.x.ai", "x.com/i/grok"], category: "generative_ai", default_risk: "medium", vendor: "xAI", description: "xAI Grok chatbot" },
    { name: "DeepSeek", domains: ["chat.deepseek.com", "api.deepseek.com"], category: "generative_ai", default_risk: "high", vendor: "DeepSeek", description: "DeepSeek AI models" },
    { name: "Mistral AI", domains: ["chat.mistral.ai", "api.mistral.ai", "mistral.ai"], category: "generative_ai", default_risk: "medium", vendor: "Mistral AI", description: "Mistral AI platform" },
    { name: "Cohere", domains: ["cohere.com", "api.cohere.ai", "dashboard.cohere.com"], category: "generative_ai", default_risk: "medium", vendor: "Cohere", description: "Enterprise AI platform" },
    { name: "AI21 Labs", domains: ["ai21.com", "api.ai21.com", "studio.ai21.com"], category: "generative_ai", default_risk: "medium", vendor: "AI21 Labs", description: "Jurassic AI models" },
    { name: "Llama (Meta)", domains: ["llama.meta.com", "ai.meta.com"], category: "generative_ai", default_risk: "medium", vendor: "Meta", description: "Meta Llama models" },
    { name: "HuggingFace", domains: ["huggingface.co", "api-inference.huggingface.co"], category: "ml_platform", default_risk: "medium", vendor: "HuggingFace", description: "ML model hub and inference" },
    { name: "Replicate", domains: ["replicate.com", "api.replicate.com"], category: "ml_platform", default_risk: "medium", vendor: "Replicate", description: "ML model hosting" },
    { name: "Together AI", domains: ["together.ai", "api.together.xyz"], category: "ml_platform", default_risk: "medium", vendor: "Together AI", description: "Open-source model platform" },
    { name: "Groq", domains: ["groq.com", "api.groq.com", "console.groq.com"], category: "generative_ai", default_risk: "medium", vendor: "Groq", description: "Fast inference platform" },
    { name: "Fireworks AI", domains: ["fireworks.ai", "api.fireworks.ai"], category: "ml_platform", default_risk: "medium", vendor: "Fireworks AI", description: "Model serving platform" },
    { name: "Anyscale", domains: ["anyscale.com", "api.anyscale.com"], category: "ml_platform", default_risk: "medium", vendor: "Anyscale", description: "Ray-based ML platform" },
    // === Code Assistants ===
    { name: "GitHub Copilot", domains: ["copilot.github.com", "github.com/features/copilot", "api.githubcopilot.com"], category: "code_assistant", default_risk: "high", vendor: "GitHub/Microsoft", description: "AI code completion" },
    { name: "Cursor", domains: ["cursor.sh", "cursor.com", "api2.cursor.sh"], category: "code_assistant", default_risk: "high", vendor: "Cursor", description: "AI code editor" },
    { name: "Tabnine", domains: ["tabnine.com", "api.tabnine.com"], category: "code_assistant", default_risk: "medium", vendor: "Tabnine", description: "AI code completion" },
    { name: "Codeium", domains: ["codeium.com", "api.codeium.com"], category: "code_assistant", default_risk: "medium", vendor: "Codeium", description: "AI code completion" },
    { name: "Amazon CodeWhisperer", domains: ["codewhisperer.aws", "aws.amazon.com/codewhisperer"], category: "code_assistant", default_risk: "medium", vendor: "Amazon", description: "AWS AI code assistant" },
    { name: "Amazon Q", domains: ["aws.amazon.com/q", "q.us-east-1.amazonaws.com"], category: "code_assistant", default_risk: "medium", vendor: "Amazon", description: "AWS AI assistant" },
    { name: "Replit AI", domains: ["replit.com", "repl.co"], category: "code_assistant", default_risk: "medium", vendor: "Replit", description: "AI-powered IDE" },
    { name: "Sourcegraph Cody", domains: ["sourcegraph.com", "cody.dev"], category: "code_assistant", default_risk: "medium", vendor: "Sourcegraph", description: "AI code assistant" },
    { name: "Codium AI", domains: ["codium.ai", "app.codium.ai"], category: "code_assistant", default_risk: "medium", vendor: "CodiumAI", description: "AI test generation" },
    { name: "Aider", domains: ["aider.chat"], category: "code_assistant", default_risk: "medium", vendor: "Aider", description: "AI pair programming" },
    { name: "Devin", domains: ["devin.ai", "app.devin.ai"], category: "code_assistant", default_risk: "high", vendor: "Cognition", description: "AI software engineer" },
    { name: "Windsurf", domains: ["windsurf.ai", "codeium.com/windsurf"], category: "code_assistant", default_risk: "medium", vendor: "Codeium", description: "AI code editor" },
    { name: "Bolt.new", domains: ["bolt.new"], category: "code_assistant", default_risk: "medium", vendor: "StackBlitz", description: "AI web app builder" },
    { name: "v0 by Vercel", domains: ["v0.dev"], category: "code_assistant", default_risk: "medium", vendor: "Vercel", description: "AI UI builder" },
    { name: "Lovable", domains: ["lovable.dev"], category: "code_assistant", default_risk: "medium", vendor: "Lovable", description: "AI app builder" },
    // === Image Generation ===
    { name: "DALL-E", domains: ["labs.openai.com"], category: "image_generation", default_risk: "medium", vendor: "OpenAI", description: "AI image generation" },
    { name: "Midjourney", domains: ["midjourney.com", "www.midjourney.com"], category: "image_generation", default_risk: "medium", vendor: "Midjourney", description: "AI image generation" },
    { name: "Stable Diffusion (Stability AI)", domains: ["stability.ai", "api.stability.ai", "dreamstudio.ai"], category: "image_generation", default_risk: "medium", vendor: "Stability AI", description: "Open-source image generation" },
    { name: "Leonardo AI", domains: ["leonardo.ai", "app.leonardo.ai"], category: "image_generation", default_risk: "low", vendor: "Leonardo AI", description: "AI image generation" },
    { name: "Adobe Firefly", domains: ["firefly.adobe.com"], category: "image_generation", default_risk: "low", vendor: "Adobe", description: "Adobe AI image generation" },
    { name: "Canva AI", domains: ["canva.com"], category: "image_generation", default_risk: "low", vendor: "Canva", description: "AI design tools" },
    { name: "Ideogram", domains: ["ideogram.ai"], category: "image_generation", default_risk: "low", vendor: "Ideogram", description: "AI image generation" },
    { name: "Flux (Black Forest Labs)", domains: ["blackforestlabs.ai"], category: "image_generation", default_risk: "low", vendor: "Black Forest Labs", description: "FLUX image models" },
    { name: "Playground AI", domains: ["playground.com", "playgroundai.com"], category: "image_generation", default_risk: "low", vendor: "Playground AI", description: "AI image creation" },
    { name: "Clipdrop", domains: ["clipdrop.co"], category: "image_generation", default_risk: "low", vendor: "Stability AI", description: "AI image editing tools" },
    // === Video Generation ===
    { name: "Sora", domains: ["sora.com", "openai.com/sora"], category: "video_generation", default_risk: "medium", vendor: "OpenAI", description: "AI video generation" },
    { name: "Runway ML", domains: ["runwayml.com", "app.runwayml.com"], category: "video_generation", default_risk: "medium", vendor: "Runway", description: "AI video generation" },
    { name: "Pika", domains: ["pika.art"], category: "video_generation", default_risk: "low", vendor: "Pika Labs", description: "AI video creation" },
    { name: "Synthesia", domains: ["synthesia.io", "app.synthesia.io"], category: "video_generation", default_risk: "medium", vendor: "Synthesia", description: "AI video avatar platform" },
    { name: "HeyGen", domains: ["heygen.com", "app.heygen.com"], category: "video_generation", default_risk: "medium", vendor: "HeyGen", description: "AI video creation" },
    { name: "D-ID", domains: ["d-id.com", "studio.d-id.com"], category: "video_generation", default_risk: "medium", vendor: "D-ID", description: "AI digital people" },
    { name: "Luma AI", domains: ["lumalabs.ai"], category: "video_generation", default_risk: "low", vendor: "Luma AI", description: "AI 3D/video generation" },
    { name: "Kling AI", domains: ["klingai.com"], category: "video_generation", default_risk: "medium", vendor: "Kuaishou", description: "AI video generation" },
    // === Voice / Audio AI ===
    { name: "ElevenLabs", domains: ["elevenlabs.io", "api.elevenlabs.io"], category: "voice_ai", default_risk: "medium", vendor: "ElevenLabs", description: "AI voice synthesis" },
    { name: "Whisper (OpenAI)", domains: ["api.openai.com/v1/audio"], category: "voice_ai", default_risk: "medium", vendor: "OpenAI", description: "Speech-to-text AI" },
    { name: "Murf AI", domains: ["murf.ai"], category: "voice_ai", default_risk: "low", vendor: "Murf AI", description: "AI voice generator" },
    { name: "Descript", domains: ["descript.com", "web.descript.com"], category: "voice_ai", default_risk: "low", vendor: "Descript", description: "AI audio/video editing" },
    { name: "Otter.ai", domains: ["otter.ai"], category: "voice_ai", default_risk: "medium", vendor: "Otter.ai", description: "AI meeting transcription" },
    { name: "AssemblyAI", domains: ["assemblyai.com", "api.assemblyai.com"], category: "voice_ai", default_risk: "medium", vendor: "AssemblyAI", description: "Speech AI API" },
    { name: "Deepgram", domains: ["deepgram.com", "api.deepgram.com"], category: "voice_ai", default_risk: "medium", vendor: "Deepgram", description: "Speech AI platform" },
    { name: "Resemble AI", domains: ["resemble.ai", "app.resemble.ai"], category: "voice_ai", default_risk: "medium", vendor: "Resemble AI", description: "AI voice cloning" },
    // === Writing & Content Assistants ===
    { name: "Jasper", domains: ["jasper.ai", "app.jasper.ai"], category: "writing_assistant", default_risk: "medium", vendor: "Jasper AI", description: "AI marketing content" },
    { name: "Copy.ai", domains: ["copy.ai", "app.copy.ai"], category: "writing_assistant", default_risk: "medium", vendor: "Copy.ai", description: "AI content generator" },
    { name: "Writesonic", domains: ["writesonic.com", "app.writesonic.com"], category: "writing_assistant", default_risk: "medium", vendor: "Writesonic", description: "AI writing tool" },
    { name: "Grammarly AI", domains: ["grammarly.com", "app.grammarly.com"], category: "writing_assistant", default_risk: "low", vendor: "Grammarly", description: "AI writing assistant" },
    { name: "QuillBot", domains: ["quillbot.com"], category: "writing_assistant", default_risk: "low", vendor: "QuillBot", description: "AI paraphrasing tool" },
    { name: "Notion AI", domains: ["notion.so", "notion.site"], category: "writing_assistant", default_risk: "medium", vendor: "Notion", description: "AI workspace assistant" },
    { name: "Wordtune", domains: ["wordtune.com", "app.wordtune.com"], category: "writing_assistant", default_risk: "low", vendor: "AI21 Labs", description: "AI writing companion" },
    { name: "Rytr", domains: ["rytr.me"], category: "writing_assistant", default_risk: "low", vendor: "Rytr", description: "AI writing assistant" },
    { name: "Sudowrite", domains: ["sudowrite.com"], category: "writing_assistant", default_risk: "low", vendor: "Sudowrite", description: "AI creative writing" },
    { name: "Textio", domains: ["textio.com"], category: "writing_assistant", default_risk: "low", vendor: "Textio", description: "AI writing optimization" },
    // === Translation AI ===
    { name: "DeepL", domains: ["deepl.com", "api.deepl.com", "api-free.deepl.com"], category: "translation", default_risk: "medium", vendor: "DeepL", description: "AI translation service" },
    { name: "Google Translate", domains: ["translate.google.com", "translation.googleapis.com"], category: "translation", default_risk: "low", vendor: "Google", description: "Machine translation" },
    { name: "Smartcat", domains: ["smartcat.com"], category: "translation", default_risk: "low", vendor: "Smartcat", description: "AI translation management" },
    // === Data Analysis / Business AI ===
    { name: "Tableau AI", domains: ["tableau.com"], category: "data_analysis", default_risk: "medium", vendor: "Salesforce", description: "AI analytics" },
    { name: "ThoughtSpot", domains: ["thoughtspot.com"], category: "data_analysis", default_risk: "medium", vendor: "ThoughtSpot", description: "AI-powered analytics" },
    { name: "DataRobot", domains: ["datarobot.com", "app.datarobot.com"], category: "data_analysis", default_risk: "high", vendor: "DataRobot", description: "Automated ML platform" },
    { name: "H2O.ai", domains: ["h2o.ai", "cloud.h2o.ai"], category: "data_analysis", default_risk: "high", vendor: "H2O.ai", description: "AutoML platform" },
    { name: "MonkeyLearn", domains: ["monkeylearn.com"], category: "data_analysis", default_risk: "medium", vendor: "MonkeyLearn", description: "Text analytics AI" },
    { name: "Obviously AI", domains: ["obviously.ai"], category: "data_analysis", default_risk: "medium", vendor: "Obviously AI", description: "No-code AI analytics" },
    { name: "Julius AI", domains: ["julius.ai"], category: "data_analysis", default_risk: "medium", vendor: "Julius AI", description: "AI data analysis" },
    // === Search AI ===
    { name: "You.com", domains: ["you.com"], category: "search_ai", default_risk: "low", vendor: "You.com", description: "AI search engine" },
    { name: "Phind", domains: ["phind.com"], category: "search_ai", default_risk: "low", vendor: "Phind", description: "AI developer search" },
    { name: "Kagi", domains: ["kagi.com"], category: "search_ai", default_risk: "low", vendor: "Kagi", description: "Premium AI search" },
    { name: "Exa AI", domains: ["exa.ai"], category: "search_ai", default_risk: "low", vendor: "Exa AI", description: "AI-powered search API" },
    // === ML Platforms & Infrastructure ===
    { name: "AWS Bedrock", domains: ["bedrock.us-east-1.amazonaws.com", "console.aws.amazon.com/bedrock"], category: "ml_platform", default_risk: "medium", vendor: "Amazon", description: "AWS managed AI models" },
    { name: "AWS SageMaker", domains: ["sagemaker.aws", "console.aws.amazon.com/sagemaker"], category: "ml_platform", default_risk: "medium", vendor: "Amazon", description: "AWS ML platform" },
    { name: "Azure OpenAI", domains: ["openai.azure.com", "cognitiveservices.azure.com"], category: "ml_platform", default_risk: "medium", vendor: "Microsoft", description: "Azure-hosted OpenAI" },
    { name: "Azure ML", domains: ["ml.azure.com"], category: "ml_platform", default_risk: "medium", vendor: "Microsoft", description: "Azure ML platform" },
    { name: "Google Vertex AI", domains: ["aiplatform.googleapis.com", "console.cloud.google.com/vertex-ai"], category: "ml_platform", default_risk: "medium", vendor: "Google", description: "Google Cloud ML platform" },
    { name: "Weights & Biases", domains: ["wandb.ai", "api.wandb.ai"], category: "ml_platform", default_risk: "medium", vendor: "Weights & Biases", description: "ML experiment tracking" },
    { name: "MLflow", domains: ["mlflow.org"], category: "ml_platform", default_risk: "low", vendor: "Databricks", description: "ML lifecycle management" },
    { name: "Databricks", domains: ["databricks.com", "cloud.databricks.com"], category: "ml_platform", default_risk: "medium", vendor: "Databricks", description: "Data + AI platform" },
    { name: "Neptune.ai", domains: ["neptune.ai", "app.neptune.ai"], category: "ml_platform", default_risk: "low", vendor: "Neptune.ai", description: "ML experiment tracking" },
    { name: "Comet ML", domains: ["comet.com", "comet.ml"], category: "ml_platform", default_risk: "low", vendor: "Comet", description: "ML experiment platform" },
    { name: "Modal", domains: ["modal.com"], category: "ml_platform", default_risk: "medium", vendor: "Modal", description: "Cloud compute for AI" },
    { name: "Paperspace", domains: ["paperspace.com", "console.paperspace.com"], category: "ml_platform", default_risk: "medium", vendor: "DigitalOcean", description: "GPU cloud platform" },
    { name: "Lightning AI", domains: ["lightning.ai"], category: "ml_platform", default_risk: "medium", vendor: "Lightning AI", description: "PyTorch-based ML platform" },
    // === Automation / AI Agents ===
    { name: "Zapier AI", domains: ["zapier.com"], category: "automation", default_risk: "medium", vendor: "Zapier", description: "AI-enhanced workflow automation" },
    { name: "Make (Integromat)", domains: ["make.com"], category: "automation", default_risk: "medium", vendor: "Make", description: "Visual automation with AI" },
    { name: "LangChain", domains: ["langchain.com", "smith.langchain.com"], category: "automation", default_risk: "medium", vendor: "LangChain", description: "LLM application framework" },
    { name: "AutoGPT", domains: ["agpt.co", "news.agpt.co"], category: "automation", default_risk: "high", vendor: "AutoGPT", description: "Autonomous AI agent" },
    { name: "CrewAI", domains: ["crewai.com"], category: "automation", default_risk: "medium", vendor: "CrewAI", description: "AI agent framework" },
    { name: "Relevance AI", domains: ["relevanceai.com", "app.relevanceai.com"], category: "automation", default_risk: "medium", vendor: "Relevance AI", description: "AI workforce platform" },
    { name: "Bardeen", domains: ["bardeen.ai"], category: "automation", default_risk: "low", vendor: "Bardeen", description: "AI workflow automation" },
    { name: "Lindy AI", domains: ["lindy.ai"], category: "automation", default_risk: "medium", vendor: "Lindy AI", description: "AI assistant agents" },
    // === Presentation / Document AI ===
    { name: "Gamma", domains: ["gamma.app"], category: "writing_assistant", default_risk: "low", vendor: "Gamma", description: "AI presentations" },
    { name: "Beautiful.ai", domains: ["beautiful.ai"], category: "writing_assistant", default_risk: "low", vendor: "Beautiful.ai", description: "AI presentations" },
    { name: "Tome", domains: ["tome.app"], category: "writing_assistant", default_risk: "low", vendor: "Tome", description: "AI storytelling" },
    { name: "SlidesAI", domains: ["slidesai.io"], category: "writing_assistant", default_risk: "low", vendor: "SlidesAI", description: "AI slide generation" },
    // === Customer Support / Chatbots ===
    { name: "Intercom Fin", domains: ["intercom.com", "app.intercom.com"], category: "chatbot", default_risk: "medium", vendor: "Intercom", description: "AI customer support" },
    { name: "Zendesk AI", domains: ["zendesk.com"], category: "chatbot", default_risk: "medium", vendor: "Zendesk", description: "AI customer service" },
    { name: "Drift", domains: ["drift.com", "app.drift.com"], category: "chatbot", default_risk: "medium", vendor: "Salesloft", description: "AI sales chatbot" },
    { name: "Ada", domains: ["ada.cx"], category: "chatbot", default_risk: "medium", vendor: "Ada", description: "AI customer service" },
    { name: "Tidio", domains: ["tidio.com"], category: "chatbot", default_risk: "low", vendor: "Tidio", description: "AI chatbot for SMBs" },
    // === Research / Specialized AI ===
    { name: "Consensus", domains: ["consensus.app"], category: "search_ai", default_risk: "low", vendor: "Consensus", description: "AI research search" },
    { name: "Semantic Scholar", domains: ["semanticscholar.org", "api.semanticscholar.org"], category: "search_ai", default_risk: "low", vendor: "Allen AI", description: "AI research search" },
    { name: "Elicit", domains: ["elicit.com", "elicit.org"], category: "search_ai", default_risk: "low", vendor: "Elicit", description: "AI research assistant" },
    { name: "Scite.ai", domains: ["scite.ai"], category: "search_ai", default_risk: "low", vendor: "Scite", description: "AI citation analysis" },
    { name: "Connected Papers", domains: ["connectedpapers.com"], category: "search_ai", default_risk: "low", vendor: "Connected Papers", description: "AI paper discovery" },
    // === AI-Enhanced Productivity ===
    { name: "Coda AI", domains: ["coda.io"], category: "writing_assistant", default_risk: "low", vendor: "Coda", description: "AI doc workspace" },
    { name: "ClickUp AI", domains: ["clickup.com", "app.clickup.com"], category: "writing_assistant", default_risk: "low", vendor: "ClickUp", description: "AI project management" },
    { name: "Monday AI", domains: ["monday.com"], category: "writing_assistant", default_risk: "low", vendor: "Monday.com", description: "AI work management" },
    { name: "Mem AI", domains: ["mem.ai", "get.mem.ai"], category: "writing_assistant", default_risk: "low", vendor: "Mem", description: "AI-powered notes" },
    { name: "Taskade AI", domains: ["taskade.com"], category: "writing_assistant", default_risk: "low", vendor: "Taskade", description: "AI project workspace" },
    // === AI Security & Detection ===
    { name: "Nightfall AI", domains: ["nightfall.ai"], category: "other", default_risk: "low", vendor: "Nightfall", description: "AI data loss prevention" },
    { name: "Protect AI", domains: ["protectai.com"], category: "other", default_risk: "low", vendor: "Protect AI", description: "AI security platform" },
    { name: "CalypsoAI", domains: ["calypsoai.com"], category: "other", default_risk: "low", vendor: "CalypsoAI", description: "AI security gateway" },
    // === AI for Design ===
    { name: "Figma AI", domains: ["figma.com"], category: "image_generation", default_risk: "low", vendor: "Figma", description: "AI design features" },
    { name: "Framer AI", domains: ["framer.com"], category: "image_generation", default_risk: "low", vendor: "Framer", description: "AI website builder" },
    { name: "Looka", domains: ["looka.com"], category: "image_generation", default_risk: "low", vendor: "Looka", description: "AI logo/brand design" },
    { name: "Khroma", domains: ["khroma.co"], category: "image_generation", default_risk: "low", vendor: "Khroma", description: "AI color tool" },
    // === AI for Sales/Marketing ===
    { name: "Salesforce Einstein", domains: ["einstein.ai"], category: "data_analysis", default_risk: "medium", vendor: "Salesforce", description: "AI for CRM" },
    { name: "HubSpot AI", domains: ["hubspot.com"], category: "data_analysis", default_risk: "medium", vendor: "HubSpot", description: "AI marketing/sales" },
    { name: "Gong", domains: ["gong.io", "app.gong.io"], category: "data_analysis", default_risk: "medium", vendor: "Gong", description: "AI revenue intelligence" },
    { name: "Chorus.ai", domains: ["chorus.ai"], category: "data_analysis", default_risk: "medium", vendor: "ZoomInfo", description: "AI conversation intelligence" },
    { name: "Apollo AI", domains: ["apollo.io", "app.apollo.io"], category: "data_analysis", default_risk: "medium", vendor: "Apollo", description: "AI sales intelligence" },
    // === AI for HR/Recruiting ===
    { name: "HireVue", domains: ["hirevue.com"], category: "data_analysis", default_risk: "high", vendor: "HireVue", description: "AI hiring assessment" },
    { name: "Eightfold AI", domains: ["eightfold.ai"], category: "data_analysis", default_risk: "high", vendor: "Eightfold", description: "AI talent intelligence" },
    { name: "Fetcher", domains: ["fetcher.ai"], category: "data_analysis", default_risk: "medium", vendor: "Fetcher", description: "AI recruiting automation" },
    // === AI for Legal ===
    { name: "Harvey AI", domains: ["harvey.ai"], category: "generative_ai", default_risk: "critical", vendor: "Harvey AI", description: "AI for legal professionals" },
    { name: "CoCounsel", domains: ["cocounsel.ai", "casetext.com"], category: "generative_ai", default_risk: "critical", vendor: "Thomson Reuters", description: "AI legal assistant" },
    { name: "Ironclad AI", domains: ["ironcladapp.com"], category: "writing_assistant", default_risk: "high", vendor: "Ironclad", description: "AI contract management" },
    // === AI for Finance ===
    { name: "Bloomberg GPT", domains: ["bloomberg.com/ai"], category: "data_analysis", default_risk: "critical", vendor: "Bloomberg", description: "AI for finance" },
    { name: "Kensho", domains: ["kensho.com"], category: "data_analysis", default_risk: "high", vendor: "S&P Global", description: "AI financial analytics" },
    { name: "AlphaSense", domains: ["alpha-sense.com"], category: "data_analysis", default_risk: "high", vendor: "AlphaSense", description: "AI market intelligence" },
    // === AI for Healthcare ===
    { name: "Nuance DAX", domains: ["nuance.com", "dax.nuance.com"], category: "voice_ai", default_risk: "critical", vendor: "Microsoft/Nuance", description: "AI clinical documentation" },
    { name: "Tempus", domains: ["tempus.com"], category: "data_analysis", default_risk: "critical", vendor: "Tempus", description: "AI precision medicine" },
];
/**
 * Build a domain-to-tool lookup map for fast event matching.
 */
function buildDomainLookup() {
    const lookup = new Map();
    for (const tool of exports.AI_TOOL_REGISTRY) {
        for (const domain of tool.domains) {
            lookup.set(domain.toLowerCase(), tool);
        }
    }
    return lookup;
}
/**
 * Match a URL or domain to a known AI tool.
 */
function matchAITool(urlOrDomain) {
    const domainLookup = buildDomainLookup();
    // Try exact domain match first
    let domain;
    try {
        const url = new URL(urlOrDomain.startsWith("http") ? urlOrDomain : `https://${urlOrDomain}`);
        domain = url.hostname.toLowerCase();
    }
    catch (_a) {
        domain = urlOrDomain.toLowerCase();
    }
    // Exact match
    if (domainLookup.has(domain)) {
        return domainLookup.get(domain);
    }
    // Try without www.
    const withoutWww = domain.replace(/^www\./, "");
    if (domainLookup.has(withoutWww)) {
        return domainLookup.get(withoutWww);
    }
    // Subdomain matching - try parent domains
    const parts = domain.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
        const parentDomain = parts.slice(i).join(".");
        if (domainLookup.has(parentDomain)) {
            return domainLookup.get(parentDomain);
        }
    }
    return undefined;
}
/**
 * Get all tools in a specific category.
 */
function getToolsByCategory(category) {
    return exports.AI_TOOL_REGISTRY.filter((tool) => tool.category === category);
}
/**
 * Get all high-risk tools.
 */
function getHighRiskTools() {
    return exports.AI_TOOL_REGISTRY.filter((tool) => tool.default_risk === "high" || tool.default_risk === "critical");
}
