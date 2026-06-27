import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parser with increased limits for large PDF files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Simple in-memory cache to protect the free tier rate limit
interface CacheEntry {
  timestamp: number;
  data: any;
}
const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

// Mock/Simulated response for showcase and fallback if Gemini API Key is missing or fails
const getMockAnalysis = (fileName: string): any => {
  return {
    companyName: "Alfa Alimentos S.A.",
    year: "2025",
    sector: "Indústria e Distribuição de Alimentos",
    executiveSummary: `A análise das demonstrações contábeis da Alfa Alimentos S.A. referente ao exercício de 2025 revela um desempenho sólido, com crescimento consistente da receita operacional líquida e melhora nas margens de rentabilidade. A empresa demonstrou excelente resiliência na gestão do capital de giro e conseguiu otimizar sua estrutura de custos de produção, o que culminou em um avanço notável no lucro líquido comparado ao ano anterior.\n\nContudo, observa-se uma leve elevação no grau de endividamento bruto devido à contratação de novos financiamentos de longo prazo para a expansão de uma nova planta industrial. Apesar do aumento na alavancagem financeira, a capacidade de pagamento de curto prazo (Liquidez Corrente) permanece saudável e confortavelmente acima de 1.5, mitigando riscos de insolvência e indicando uma gestão financeira equilibrada e estratégica.`,
    strengths: [
      "Forte crescimento de 25% na Receita Operacional Líquida decorrente da expansão de novos canais de distribuição.",
      "Melhora na Margem Líquida que passou de 8.5% em 2024 para 10.1% em 2025, evidenciando excelente controle de despesas operacionais.",
      "Excelente Retorno sobre o Patrimônio Líquido (ROE) de 14.5%, indicando alta eficiência na rentabilidade do capital dos acionistas.",
      "Índice de Liquidez Corrente confortável (1.67), indicando segurança para liquidação das obrigações imediatas."
    ],
    challenges: [
      "Elevação no Grau de Endividamento de 40% para 45%, demandando monitoramento do fluxo de caixa operacional para serviço da dívida.",
      "Ocorrência de variação cambial desfavorável nas Notas Explicativas que impactou as despesas financeiras líquidas.",
      "Aumento nos prazos médios de estocagem de insumos importados, o que reteve caixa adicional em estoques de segurança."
    ],
    recommendations: [
      "Priorizar o alongamento do perfil das dívidas de curto prazo, aproveitando o bom rating de crédito da empresa para negociar taxas menores.",
      "Implementar ferramentas de hedge cambial para atenuar a volatilidade observada no custo de aquisição de insumos importados.",
      "Otimizar a gestão de estoques através de metodologias Just-In-Time para liberar capital de giro e aumentar a liquidez de caixa.",
      "Apresentar este relatório com ênfase nas margens de rentabilidade ao Conselho para justificar os investimentos em expansão."
    ],
    indicators: {
      liquidity: {
        current: { value: 1.67, explanation: "Capacidade de cobrir as dívidas de curto prazo com ativos de curto prazo. Um índice de 1.67 indica excelente folga de liquidez, onde para cada R$ 1,00 de dívida, a empresa possui R$ 1,67 em caixa, clientes ou estoques." },
        general: { value: 1.25, explanation: "Mede a liquidez de longo prazo considerando ativos e passivos realizáveis a longo prazo. O valor de 1.25 indica solidez estrutural no longo prazo." },
        dry: { value: 1.15, explanation: "Mede a liquidez imediata excluindo totalmente os estoques, que dependem de vendas. Um valor acima de 1.0 (1.15) comprova que o caixa e contas a receber cobrem totalmente as obrigações sem depender de vendas adicionais." }
      },
      profitability: {
        grossMargin: { value: 35.5, explanation: "Percentual de lucro obtido sobre a receita após dedução dos custos diretos. 35.5% demonstra excelente poder de precificação e eficiência de fábrica." },
        operatingMargin: { value: 15.2, explanation: "Eficiência operacional antes dos resultados financeiros e impostos. 15.2% reflete bom controle de despesas administrativas e comerciais." },
        netMargin: { value: 10.1, explanation: "O lucro final que sobra para a empresa após todas as deduções. Estar em dois dígitos (10.1%) é um marco excelente para o setor de alimentação." },
        roa: { value: 8.4, explanation: "Retorno sobre Ativos Totais, indicando o quanto a empresa lucra para cada real investido na estrutura geral de ativos." },
        roe: { value: 14.5, explanation: "Retorno sobre Patrimônio Líquido. 14.5% mostra que o investimento dos sócios é altamente rentável se comparado com o custo de capital de mercado." }
      },
      indebtedness: {
        debtRatio: { value: 45.0, explanation: "Percentual dos ativos totais financiados por terceiros. 45% é considerado um patamar conservador e seguro, garantindo excelente autonomia financeira." },
        thirdCapitalParticipation: { value: 81.8, explanation: "Relação entre Capital de Terceiros e Capital Próprio. Mostra a dependência de recursos externos (bancos, fornecedores) frente ao PL." }
      }
    },
    balanceSheetReport: `O Balanço Patrimonial de 2025 demonstra um crescimento patrimonial ordenado. O Ativo Total expandiu-se principalmente no Ativo Não Circulante (Imobilizado) refletindo as novas instalações fabris. No passivo, observamos um deslocamento planejado de passivos de curto prazo para o longo prazo, o que aliviou consideravelmente a pressão sobre a tesouraria no curto prazo. O Patrimônio Líquido aumentou organicamente através da retenção parcial de lucros do período.`,
    dreReport: `A Demonstração do Resultado do Exercício (DRE) demonstra um crescimento robusto de 20% no faturamento bruto, alcançando R$ 15.000.000. Os custos de vendas foram muito bem contidos através de contratos de fornecimento de longo prazo, permitindo que o Lucro Bruto crescesse em proporção maior que a receita. As despesas com vendas e administrativas mantiveram-se estáveis como proporção da receita, alavancando a lucratividade líquida final para R$ 1.515.000.`,
    dfcReport: `A Demonstração dos Fluxos de Caixa (DFC) confirma a excelente qualidade dos lucros da Alfa Alimentos. As atividades operacionais geraram um fluxo de caixa positivo de R$ 1.800.000, valor superior ao próprio Lucro Líquido devido a ajustes de depreciação e amortização. Esse caixa operacional foi fundamental para autofinanciar cerca de 60% das aquisições de imobilizado (investimentos de R$ 2.500.000), sendo o saldo restante financiado por debêntures emitidas a longo prazo.`,
    notesReport: `Nas Notas Explicativas, destaca-se que a empresa possui contingências fiscais classificadas como de perda 'possível' (portanto não provisionadas) no valor de R$ 350.000, o que não representa ameaça imediata. Adicionalmente, as notas de transações com partes relacionadas revelam que todas as operações foram realizadas em condições estritas de mercado, com total transparência corporativa.`,
    charts: {
      revenueProfit: [
        { year: "2023", revenue: 10000000, netProfit: 750000 },
        { year: "2024", revenue: 12000000, netProfit: 1020000 },
        { year: "2025", revenue: 15000000, netProfit: 1515000 }
      ],
      assetsLiabilities: [
        { category: "Ativo Circulante", value: 5000000 },
        { category: "Ativo Não Circulante", value: 7000000 },
        { category: "Passivo Circulante", value: 3000000 },
        { category: "Passivo Não Circulante", value: 2500000 },
        { category: "Patrimônio Líquido", value: 6500000 }
      ],
      liquidityEvolution: [
        { metric: "L. Corrente", currentYear: 1.67, previousYear: 1.45 },
        { metric: "L. Geral", currentYear: 1.25, previousYear: 1.15 },
        { metric: "L. Seca", currentYear: 1.15, previousYear: 0.98 }
      ],
      profitabilityEvolution: [
        { metric: "M. Bruta %", currentYear: 35.5, previousYear: 32.5 },
        { metric: "M. Líquida %", currentYear: 10.1, previousYear: 8.5 },
        { metric: "ROE %", currentYear: 14.5, previousYear: 11.2 }
      ]
    },
    isSimulated: true,
    simulatedReason: `Análise simulada de demonstração real para apresentação do sistema. (Origem do arquivo enviado: ${fileName})`
  };
};

// API Endpoint for PDF Analysis
app.post("/api/analyze", async (req, res) => {
  const { pdfBase64, fileName, fileSize, forceSimulated } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: "O arquivo PDF base64 é obrigatório." });
  }

  // Create a cache key using fileName and fileSize to prevent identical repeated requests
  const cacheKey = `${fileName}_${fileSize}`;
  const now = Date.now();

  if (analysisCache.has(cacheKey)) {
    const cached = analysisCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache] Returning cached analysis for ${fileName}`);
      return res.json(cached.data);
    }
  }

  // Check if Gemini API key is configured or if user requested standard simulation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || forceSimulated) {
    console.log(`[Simulation Mode] API Key not set or Simulation explicitly requested. Returning mock financial analysis.`);
    const mockData = getMockAnalysis(fileName || "balanco.pdf");
    analysisCache.set(cacheKey, { timestamp: now, data: mockData });
    return res.json(mockData);
  }

  try {
    console.log(`[Gemini API] Processing and analyzing PDF file: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

    // Initialize modern Google GenAI SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Strip header prefix if present (e.g. "data:application/pdf;base64,")
    const cleanBase64 = pdfBase64.includes(";base64,")
      ? pdfBase64.split(";base64,")[1]
      : pdfBase64;

    const pdfPart = {
      inlineData: {
        mimeType: "application/pdf",
        data: cleanBase64,
      },
    };

    const promptText = `
Você é um CFO experiente, auditor e especialista em contabilidade financeira brasileira.
Sua missão é realizar uma análise financeira completa, profissional e detalhada das Demonstrações Contábeis contidas no arquivo PDF enviado (que inclui Balanço Patrimonial, DRE, DFC, DMPL e Notas Explicativas).

Faça a leitura detalhada das tabelas e notas e extraia as principais informações financeiras estruturadas.
Você DEVE obrigatoriamente retornar a resposta estritamente como um objeto JSON válido, sem qualquer tipo de markdown ou texto adicional fora do JSON. A estrutura deve coincidir EXACTAMENTE com o seguinte formato:

{
  "companyName": "Nome exato da Empresa",
  "year": "Ano analisado mais recente (ex: 2025)",
  "sector": "Setor de atuação estimado ou declarado da empresa",
  "executiveSummary": "Um texto analítico profundo e fluido em Português (2-3 parágrafos). Deve sintetizar com seriedade a saúde financeira geral da empresa para o gestor e diretoria.",
  "strengths": [
    "Ponto forte financeiro 1, extraído dos dados, justificando com valores se possível.",
    "Ponto forte financeiro 2..."
  ],
  "challenges": [
    "Ponto de atenção ou risco financeiro 1, justificando com valores se possível.",
    "Ponto de atenção ou risco financeiro 2..."
  ],
  "recommendations": [
    "Recomendação estratégica aplicável 1 baseada nas dores observadas.",
    "Recomendação estratégica aplicável 2..."
  ],
  "indicators": {
    "liquidity": {
      "current": { "value": 1.5, "explanation": "Breve análise do índice de liquidez corrente." },
      "general": { "value": 1.2, "explanation": "Análise da liquidez geral." },
      "dry": { "value": 1.0, "explanation": "Análise da liquidez seca." }
    },
    "profitability": {
      "grossMargin": { "value": 35.0, "explanation": "Margem bruta calculada ou extraída." },
      "operatingMargin": { "value": 15.0, "explanation": "Margem operacional calculada ou extraída." },
      "netMargin": { "value": 10.0, "explanation": "Margem líquida calculada ou extraída." },
      "roa": { "value": 8.0, "explanation": "Retorno sobre os ativos calculados." },
      "roe": { "value": 14.0, "explanation": "Retorno sobre o patrimônio líquido calculado." }
    },
    "indebtedness": {
      "debtRatio": { "value": 45.0, "explanation": "Grau de endividamento geral calculado (Passivo Total / Ativo Total)." },
      "thirdCapitalParticipation": { "value": 80.0, "explanation": "Participação de capital de terceiros sobre o PL." }
    }
  },
  "balanceSheetReport": "Texto detalhado de análise vertical e horizontal do Balanço Patrimonial (Ativos circulantes/não circulantes e a estrutura de Passivos e Capital Próprio).",
  "dreReport": "Texto detalhado focado no desempenho da DRE (Receitas, variação do EBITDA, evolução do lucro líquido e margens).",
  "dfcReport": "Análise sobre de onde veio e para onde foi o dinheiro da empresa através dos fluxos operacional, de investimentos e de financiamento.",
  "notesReport": "Peculiaridades cruciais das notas explicativas: contingências judiciais, práticas contábeis, transações com sócios ou obrigações com vencimentos significativos.",
  "charts": {
    "revenueProfit": [
      { "year": "Ano Anterior", "revenue": 10000000, "netProfit": 800000 },
      { "year": "Ano Recente", "revenue": 12000000, "netProfit": 1200000 }
    ],
    "assetsLiabilities": [
      { "category": "Ativo Circulante", "value": 5000000 },
      { "category": "Ativo Não Circulante", "value": 7000000 },
      { "category": "Passivo Circulante", "value": 3000000 },
      { "category": "Passivo Não Circulante", "value": 2000000 },
      { "category": "Patrimônio Líquido", "value": 7000000 }
    ],
    "liquidityEvolution": [
      { "metric": "L. Corrente", "currentYear": 1.5, "previousYear": 1.3 },
      { "metric": "L. Geral", "currentYear": 1.2, "previousYear": 1.1 },
      { "metric": "L. Seca", "currentYear": 1.0, "previousYear": 0.9 }
    ],
    "profitabilityEvolution": [
      { "metric": "M. Bruta %", "currentYear": 35.0, "previousYear": 33.0 },
      { "metric": "M. Líquida %", "currentYear": 10.0, "previousYear": 8.0 },
      { "metric": "ROE %", "currentYear": 14.0, "previousYear": 12.0 }
    ]
  }
}

INSTRUÇÕES DE PREENCHIMENTO EXTREMAMENTE IMPORTANTES:
1. Extraia os números reais dos anos presentes no arquivo. O campo "charts.revenueProfit" deve conter de preferência de 2 a 3 anos históricos se disponíveis para vermos a evolução. Os anos devem ser as chaves em formato string (ex: "2024", "2025").
2. Calcule os indicadores financeiros de forma técnica clássica. Caso falte algum dado específico, faça um cálculo ou projeção aproximada baseada no contexto global do relatório e justifique o cálculo de forma inteligente nas explicações de cada indicador.
3. Não use terminologia em inglês (ex: use 'Retorno sobre o PL' em vez de 'ROE' nos textos de explicação, embora o campo do JSON mantenha 'roe' para compatibilidade técnica). Toda a resposta deve ser em Português do Brasil (PT-BR).
4. Forneça números inteiros ou decimais reais nos valores dos campos de gráficos (valores monetários em reais absolutos se possível para receitas e ativos; percentuais em floats sem o símbolo '%' para margens/retornos e endividamento, ex: 14.5).
5. Certifique-se de que o JSON seja perfeitamente válido. Não coloque barras de escape ou markdown adicional. Comece a resposta diretamente com '{' e termine com '}'.
    `;

    // Request analysis from Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [pdfPart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Você é um auditor contábil sênior especializado em estruturar análises corporativas profundas no formato JSON solicitado.",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("A resposta da inteligência artificial retornou vazia.");
    }

    // Try to parse the JSON output
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
      parsedData.isSimulated = false;
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON. Raw output was:", responseText);
      throw new Error("Falha ao processar os dados estruturados do relatório. Formato de resposta inválido.");
    }

    // Save to cache
    analysisCache.set(cacheKey, { timestamp: now, data: parsedData });

    return res.json(parsedData);

  } catch (error: any) {
    console.error("[Gemini Analysis Error]:", error);
    return res.status(500).json({
      error: "Falha na análise via Inteligência Artificial.",
      details: error.message || "Erro desconhecido durante o processamento do documento.",
      suggestSimulated: true
    });
  }
});

// Serve frontend assets in production and Vite middleware in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Dev] Vite Dev Server mounted on Express");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Prod] Serving static production files from dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
