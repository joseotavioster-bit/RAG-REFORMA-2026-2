# Documentação e Diretrizes de Análise: ContábilAI

Este projeto foi estruturado para fornecer uma análise contábil de alta fidelidade baseada em arquivos PDF enviados por profissionais da área contábil para o **Google AI Studio**. 

---

## 🚀 Arquitetura do Sistema

A aplicação é **Full-Stack (React/Vite + Node.js/Express)** e opera sob os mais rigorosos padrões de segurança e performance exigidos pela plataforma:

1. **Camada Frontend (React 19 + Tailwind CSS + Recharts):**
   - **Upload Inteligente:** Suporta seleção manual e Drag & Drop de arquivos PDF de até 50MB.
   - **Bento-Grid de KPIs:** Exibe índices clássicos de Liquidez, Rentabilidade e Endividamento com explicações sob demanda para gestores (C-Level).
   - **Gráficos Dinâmicos:** Renderiza 4 gráficos avançados usando `recharts` (Receita vs Lucro, Composição de Ativos/Passivos, Evolução de Liquidez e Evolução de Margens).
   - **Layout Impresso Otimizado:** Formatação CSS `@media print` para exportar o relatório executivo como PDF de apresentação comercial diretamente pelo navegador (`Ctrl + P`).

2. **Camada Backend (Express + @google/genai SDK):**
   - **Auditoria Server-side:** Todo o processamento do arquivo e chamadas à API são realizados no servidor, mantendo as chaves secretas protegidas.
   - **Modelo Recomendado:** Utiliza o `gemini-3.5-flash` para processar e analisar as páginas dos relatórios contábeis, garantindo velocidade de inferência e excelente leitura de tabelas contábeis complexas.
   - **Proteção de Quota (Free Tier):** Implementa um sistema de cache em memória (`analysisCache`) de 30 minutos indexado por arquivo para evitar chamadas duplicadas e estouro de limites de requisições por minuto (RPM).
   - **Modo Simulação (Alfa Alimentos S.A.):** Fornece uma análise simulada realista e completa como fallback caso o usuário não tenha configurado sua chave API (`GEMINI_API_KEY`) nos Secrets do AI Studio.

---

## 📋 Prompt Estruturado de Análise Contábil (Instrução da IA)

Caso você queira apresentar ou ajustar este prompt no painel do Google AI Studio diretamente, use a instrução estruturada abaixo. Ela foi projetada para extrair dados limpos em formato JSON contábil padronizado:

```text
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
```

---

## 🛡️ Gestão de Limites e Cota Contábil (Gratuidade)

A fim de respeitar os limites de chamadas por minuto (RPM) e cota de processamento gratuito da API do Google AI Studio, a plataforma implementa:

1. **In-Memory Analysis Cache (30 min):** Se o mesmo arquivo PDF for carregado repetidamente na mesma sessão, o servidor recupera o relatório do cache em vez de reenviar ao Gemini. Isso poupa integralmente a sua cota.
2. **Compressão/Tratamento Base64 Direto:** O arquivo PDF é transmitido via POST de forma direta e assíncrona, eliminando a sobrecarga de manipulação física no disco.
3. **Fallback Automático (Modo Simulação):** Se a cota diária da API for ultrapassada, o sistema notifica o usuário amigavelmente e oferece a ativação imediata do modo de simulação, mantendo a experiência do usuário fluida e responsiva.
