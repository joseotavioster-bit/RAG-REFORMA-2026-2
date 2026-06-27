import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  LineChart as LineIcon,
  BookOpen
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { AnalysisResponse } from "./types";

// Loading phrases to keep the user engaged during calculation
const LOADING_PHRASES = [
  "Enviando arquivo ao Gemini e detectando as demonstrações contábeis...",
  "Mapeando estrutura do Balanço Patrimonial...",
  "Cruzando informações do Ativo Circulante e Passivo Circulante...",
  "Efetuando análise vertical e horizontal da DRE...",
  "Calculando índices de Liquidez Corrente, Geral e Seca...",
  "Estruturando Margens de Lucro (Bruta, Operacional e Líquida)...",
  "Avaliando os indicadores de rentabilidade ROA e ROE...",
  "Mapeando estrutura de endividamento e capital de terceiros...",
  "Analisando geração e consumo de caixa através da DFC...",
  "Auditando Notas Explicativas em busca de contingências fiscais...",
  "Consolidando destaques e montando o relatório executivo em Português...",
  "Preparando gráficos interativos de alta performance..."
];

export default function App() {
  // State variables
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "kpis" | "charts" | "qualitative">("summary");
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [forceSimulated, setForceSimulated] = useState<boolean>(false);

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Por favor, carregue apenas arquivos PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Por favor, carregue apenas arquivos PDF.");
      }
    }
  };

  // Cycling the loading messages
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Request Analysis from Express server
  const analyzeFile = async (selectedFile: File | null, forceDemo: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      if (forceDemo) {
        // Request simulated analysis immediately from server
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: "dummy_simulated_base64_data",
            fileName: "balanco_patrimonial_exemplo.pdf",
            fileSize: 1548230,
            forceSimulated: true
          }),
        });

        if (!response.ok) {
          throw new Error("Erro de servidor ao processar a simulação contábil.");
        }

        const data: AnalysisResponse = await response.json();
        setAnalysis(data);
        setActiveTab("summary");
      } else if (selectedFile) {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64String = reader.result as string;
            
            const response = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pdfBase64: base64String,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                forceSimulated: false
              }),
            });

            const responseData = await response.json();

            if (!response.ok) {
              // Check if the backend suggests a simulation or has a descriptive error
              if (responseData.suggestSimulated) {
                setError(`${responseData.error || "Erro na análise."} Para testar a ferramenta, você pode usar o "Modo Demonstração" marcando a caixa de simulação contábil.`);
              } else {
                throw new Error(responseData.error || "Ocorreu um erro ao processar o arquivo.");
              }
            } else {
              setAnalysis(responseData);
              setActiveTab("summary");
            }
          } catch (err: any) {
            setError(err.message || "Não foi possível enviar as demonstrações ao servidor.");
          } finally {
            setIsLoading(false);
          }
        };

        reader.onerror = () => {
          setError("Erro ao ler o arquivo PDF local.");
          setIsLoading(false);
        };

        reader.readAsDataURL(selectedFile);
        return; // handle async inside reader.onload
      } else {
        setError("Nenhum arquivo ou opção de simulação selecionada.");
      }
    } catch (err: any) {
      setError(err.message || "Erro durante o processamento.");
    } finally {
      if (!selectedFile || forceDemo) {
        setIsLoading(false);
      }
    }
  };

  const handleStartAnalysis = () => {
    if (!file && !forceSimulated) {
      setError("Por favor, selecione um arquivo PDF ou ative o modo demonstração.");
      return;
    }
    analyzeFile(file, forceSimulated);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setExpandedKpi(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper formatting functions
  const formatCurrency = (val: number) => {
    if (val >= 1e6) {
      return `R$ ${(val / 1e6).toFixed(2)}M`;
    }
    if (val >= 1e3) {
      return `R$ ${(val / 1e3).toFixed(1)} mil`;
    }
    return `R$ ${val.toLocaleString("pt-BR")}`;
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  // Colors for assets and liabilities chart
  const COLORS = ["#059669", "#34d399", "#dc2626", "#f87171", "#3b82f6"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 transition-all">
      {/* HEADER BAR - HIDDEN IN PRINT */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md shadow-emerald-200">
            <Activity className="h-6 w-6" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">
              ContábilAI
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Análise Inteligente de Demonstrações Contábeis
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-mono">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Ref: {new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          {analysis && (
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Relatório</span>
            </button>
          )}
        </div>
      </header>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatório Executivo Contábil</h1>
            <p className="text-sm text-slate-600">Desenvolvido por ContábilAI - Inteligência Artificial para Gestão Financeira</p>
          </div>
          <p className="text-sm font-mono">{new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* LOADING SCREEN */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-24 w-24 border-4 border-slate-100 border-t-emerald-600"></div>
              <div className="absolute bg-emerald-50 text-emerald-700 font-bold p-3 rounded-full">
                <TrendingUp className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <h3 className="mt-8 text-lg font-bold text-slate-800 text-center max-w-md font-display">
              Gerando Auditoria Contábil
            </h3>
            <p className="mt-2 text-sm text-emerald-600 font-medium text-center max-w-lg min-h-[2.5rem] px-4 animate-pulse">
              {LOADING_PHRASES[loadingPhraseIndex]}
            </p>
            <div className="mt-6 w-64 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((loadingPhraseIndex + 1) / LOADING_PHRASES.length) * 100}%` }}
              ></div>
            </div>
            <p className="mt-8 text-xs text-slate-400 max-w-xs text-center">
              Esta operação respeita a cota gratuita do Gemini, analisando todo o documento estruturalmente.
            </p>
          </div>
        )}

        {/* WELCOME / UPLOAD STAGE */}
        {!isLoading && !analysis && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
                Transforme Balanços em Decisões
              </h2>
              <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
                Carregue o PDF com as demonstrações contábeis (Balanço, DRE, DFC, DMPL, Notas Explicativas) da sua empresa e receba na hora gráficos dinâmicos de alta qualidade e um relatório executivo formatado para o seu gestor.
              </p>
            </div>

            {/* MAIN UPLOAD COMPONENT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Atenção</h4>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${
                  isDragActive
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-300 hover:border-emerald-500 bg-slate-50/50"
                }`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="bg-white p-4 rounded-full shadow-md border border-slate-100">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Contábil
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-800">
                      Arraste e solte o PDF contábil aqui ou clique para buscar
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Formatos recomendados: Balanço Patrimonial, DRE, Fluxo de Caixa (DFC) e Notas Explicativas consolidados em um único PDF.
                    </p>
                  </div>
                )}
              </div>

              {/* SIMULATED MODE TOGGLE */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sem Chave de API
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">
                      Deseja simular um Balanço de Exemplo?
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 max-w-lg">
                    Se você não possui um arquivo contábil no momento ou sua chave de IA não está ativa nos Secrets do AI Studio, use o Modo Demonstração para ver instantaneamente a qualidade visual e estrutural do relatório executivo.
                  </p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceSimulated}
                      onChange={(e) => {
                        setForceSimulated(e.target.checked);
                        if (e.target.checked) setFile(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700">Simular Alfa Alimentos</span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleStartAnalysis}
                  className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 duration-200 flex items-center justify-center space-x-2 ${
                    file || forceSimulated
                      ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100 cursor-pointer"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  <span>Iniciar Auditoria e Análise Inteligente</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* DICA PARA CONTADORES E CONSULTORES */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg w-fit text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Leitura Completa</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  O Gemini processa o PDF inteiro contendo Balanço, DRE, DFC e Notas Explicativas. A IA lê tabelas financeiras com precisão mesmo em PDFs longos.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg w-fit text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Foco Contábil</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Todos os cálculos de Liquidez (Corrente, Geral, Seca) e rentabilidades como ROA e ROE são calculados de forma canônica e justificados contabilmente.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg w-fit text-emerald-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pronto Para Apresentar</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nossa plataforma gera explicações simples para os indicadores, permitindo que qualquer empresário ou gestor compreenda perfeitamente os gráficos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ANALYSIS RESULT SCREEN */}
        {analysis && (
          <div className="space-y-8 animate-fade-in">
            {/* BACK BUTTON AND METADATA BANNER */}
            <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {analysis.isSimulated ? "Modo Simulação" : "Extração Inteligente"}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{analysis.companyName}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Building className="h-3.5 w-3.5" />
                      <span>{analysis.sector}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Ano de Análise: {analysis.year}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Analisar Outro Arquivo
                </button>
              </div>
            </div>

            {/* PRINT-ONLY METADATA */}
            <div className="hidden print:block space-y-3 border-b pb-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Empresa Analisada</h3>
                  <p className="text-lg font-bold text-slate-900">{analysis.companyName}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Setor Econômico</h3>
                  <p className="text-lg font-semibold text-slate-800">{analysis.sector}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ano Fiscal Analisado</h3>
                  <p className="text-lg font-semibold text-slate-800">{analysis.year}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Método de Avaliação</h3>
                  <p className="text-lg font-semibold text-slate-800">Inteligência Artificial (CFO Co-Pilot)</p>
                </div>
              </div>
            </div>

            {/* TAB SELECTION - NO-PRINT */}
            <div className="no-print bg-slate-200/60 p-1.5 rounded-xl flex flex-wrap gap-1 max-w-3xl">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === "summary"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Relatório Executivo</span>
              </button>
              <button
                onClick={() => setActiveTab("kpis")}
                className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === "kpis"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Indicadores Financeiros</span>
              </button>
              <button
                onClick={() => setActiveTab("charts")}
                className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === "charts"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <LineIcon className="h-4 w-4" />
                <span>Gráficos de Performance</span>
              </button>
              <button
                onClick={() => setActiveTab("qualitative")}
                className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === "qualitative"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Destaques por Relatório</span>
              </button>
            </div>

            {/* TAB CONTENT */}

            {/* TAB 1: EXECUTIVE SUMMARY */}
            {(activeTab === "summary" || window.matchMedia("print").matches) && (
              <div className="space-y-8 print:block">
                {/* Executive Prose */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center space-x-2 font-display">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <span>Síntese da Análise Contábil</span>
                  </h3>
                  <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line text-justify">
                    {analysis.executiveSummary}
                  </div>
                </div>

                {/* Strengths & Challenges */}
                <div className="grid md:grid-cols-2 gap-8 print:grid-cols-2">
                  {/* Strengths */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center space-x-2 text-emerald-700 font-display">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Pontos Fortes da Empresa</span>
                    </h3>
                    <ul className="space-y-3.5">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-600 leading-relaxed">
                          <span className="p-0.5 bg-emerald-50 rounded text-emerald-600 shrink-0 mt-0.5">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Challenges */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center space-x-2 text-amber-700 font-display">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Desafios & Pontos de Atenção</span>
                    </h3>
                    <ul className="space-y-3.5">
                      {analysis.challenges.map((challenge, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-600 leading-relaxed">
                          <span className="p-0.5 bg-amber-50 rounded text-amber-600 shrink-0 mt-0.5">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:break">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center space-x-2 text-indigo-700 font-display">
                    <TrendingUp className="h-5 w-5" />
                    <span>Recomendações Práticas para a Gestão</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {analysis.recommendations.map((recommendation, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-3">
                        <div className="bg-indigo-100 text-indigo-700 font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KPIs & RATIOS */}
            {(activeTab === "kpis" || window.matchMedia("print").matches) && (
              <div className="space-y-8 print:block">
                {/* INTRO EXPLAINER FOR C-LEVEL */}
                <div className="no-print bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl flex items-start space-x-3">
                  <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Abaixo estão consolidados os principais índices financeiros calculados. Cada item pode ser expandido clicando no cartão para visualizar uma explicação simples do significado contábil do indicador, permitindo que o gestor entenda a relevância prática de cada número.
                  </p>
                </div>

                {/* GRID BY INDICATOR CATEGORY */}
                <div className="space-y-6">
                  {/* LIQUIDITY GROUP */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                      <span>Capacidade de Pagamento (Liquidez)</span>
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Current Liquidity */}
                      <div
                        onClick={() => setExpandedKpi(expandedKpi === "liq_cor" ? null : "liq_cor")}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition-all duration-200 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liquidez Corrente</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${analysis.indicators.liquidity.current.value >= 1 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {analysis.indicators.liquidity.current.value >= 1 ? "Saudável" : "Atenção"}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                            {analysis.indicators.liquidity.current.value.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {analysis.indicators.liquidity.current.explanation}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-600">
                          <span>Saber mais</span>
                          {expandedKpi === "liq_cor" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        {expandedKpi === "liq_cor" && (
                          <div className="pt-2 border-t text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                            <span className="font-bold block text-slate-700">Fórmula Clássica:</span>
                            <span className="font-mono text-slate-500 block">Ativo Circulante / Passivo Circulante</span>
                            <p className="mt-1 font-medium text-slate-600">Representa a capacidade da empresa de saldar suas dívidas imediatas de curto prazo. Um valor acima de 1.00 indica sobra patrimonial imediata.</p>
                          </div>
                        )}
                      </div>

                      {/* Dry Liquidity */}
                      <div
                        onClick={() => setExpandedKpi(expandedKpi === "liq_sec" ? null : "liq_sec")}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition-all duration-200 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liquidez Seca</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${analysis.indicators.liquidity.dry.value >= 1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {analysis.indicators.liquidity.dry.value >= 1 ? "Excelente" : "Moderado"}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                            {analysis.indicators.liquidity.dry.value.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {analysis.indicators.liquidity.dry.explanation}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-600">
                          <span>Saber mais</span>
                          {expandedKpi === "liq_sec" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        {expandedKpi === "liq_sec" && (
                          <div className="pt-2 border-t text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                            <span className="font-bold block text-slate-700">Fórmula Clássica:</span>
                            <span className="font-mono text-slate-500 block">(Ativo Circulante - Estoques) / Passivo Circulante</span>
                            <p className="mt-1 font-medium text-slate-600">Avalia a liquidez imediata ignorando totalmente as vendas de estoques de segurança, testando a resiliência imediata de caixa e recebíveis.</p>
                          </div>
                        )}
                      </div>

                      {/* General Liquidity */}
                      <div
                        onClick={() => setExpandedKpi(expandedKpi === "liq_ger" ? null : "liq_ger")}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition-all duration-200 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liquidez Geral</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            Longo Prazo
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                            {analysis.indicators.liquidity.general.value.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {analysis.indicators.liquidity.general.explanation}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-600">
                          <span>Saber mais</span>
                          {expandedKpi === "liq_ger" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        {expandedKpi === "liq_ger" && (
                          <div className="pt-2 border-t text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                            <span className="font-bold block text-slate-700">Fórmula Clássica:</span>
                            <span className="font-mono text-slate-500 block">(Ativo Circ. + Realizável L. Prazo) / (Passivo Circ. + Exigível L. Prazo)</span>
                            <p className="mt-1 font-medium text-slate-600">Mostra a solvência geral ao longo da história da empresa, contabilizando também bens e obrigações de longo prazo.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PROFITABILITY GROUP */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                      <span>Eficiência & Lucratividade (Rentabilidade)</span>
                    </h3>
                    <div className="grid sm:grid-cols-5 gap-4">
                      {/* Gross Margin */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Margem Bruta</span>
                        <h4 className="text-2xl font-black text-emerald-700 tracking-tight font-display">
                          {formatPercent(analysis.indicators.profitability.grossMargin.value)}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {analysis.indicators.profitability.grossMargin.explanation}
                        </p>
                      </div>

                      {/* Operating Margin */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Margem Operacional</span>
                        <h4 className="text-2xl font-black text-emerald-700 tracking-tight font-display">
                          {formatPercent(analysis.indicators.profitability.operatingMargin.value)}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {analysis.indicators.profitability.operatingMargin.explanation}
                        </p>
                      </div>

                      {/* Net Margin */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Margem Líquida</span>
                        <h4 className="text-2xl font-black text-emerald-700 tracking-tight font-display">
                          {formatPercent(analysis.indicators.profitability.netMargin.value)}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {analysis.indicators.profitability.netMargin.explanation}
                        </p>
                      </div>

                      {/* ROA */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">ROA (Retorno S/ Ativo)</span>
                        <h4 className="text-2xl font-black text-emerald-700 tracking-tight font-display">
                          {formatPercent(analysis.indicators.profitability.roa.value)}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {analysis.indicators.profitability.roa.explanation}
                        </p>
                      </div>

                      {/* ROE */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">ROE (Retorno S/ PL)</span>
                        <h4 className="text-2xl font-black text-emerald-700 tracking-tight font-display">
                          {formatPercent(analysis.indicators.profitability.roe.value)}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {analysis.indicators.profitability.roe.explanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INDEBTEDNESS GROUP */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                      <span>Endividamento & Estrutura de Capitais</span>
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Debt Ratio */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start space-x-4">
                        <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                          <Activity className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Grau de Endividamento</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Seguro &lt; 60%</span>
                          </div>
                          <h4 className="text-2xl font-bold text-slate-900 font-display">
                            {formatPercent(analysis.indicators.indebtedness.debtRatio.value)}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {analysis.indicators.indebtedness.debtRatio.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Capital Participation */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start space-x-4">
                        <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Participação de Capital de Terceiros</span>
                          <h4 className="text-2xl font-bold text-slate-900 font-display">
                            {formatPercent(analysis.indicators.indebtedness.thirdCapitalParticipation.value)}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {analysis.indicators.indebtedness.thirdCapitalParticipation.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CHARTS & VISUALIZATIONS */}
            {(activeTab === "charts" || window.matchMedia("print").matches) && (
              <div className="space-y-8 print:block">
                {/* CHARTS GRID */}
                <div className="grid md:grid-cols-2 gap-8 print:grid-cols-2">
                  {/* CHART 1: REVENUE AND PROFIT */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2 font-display">
                      Evolução Histórica: Receitas vs Lucro Líquido (R$)
                    </h4>
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analysis.charts.revenueProfit}
                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" stroke="#94a3b8" />
                          <YAxis tickFormatter={formatCurrency} stroke="#94a3b8" />
                          <Tooltip
                            formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                            contentStyle={{ borderRadius: "8px", borderColor: "#cbd5e1" }}
                          />
                          <Legend />
                          <Bar name="Receita Líquida" dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
                          <Bar name="Lucro Líquido" dataKey="netProfit" fill="#059669" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHART 2: ASSET COMPOSITION */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2 font-display">
                      Composição Patrimonial (Saldos Recentes em R$)
                    </h4>
                    <div className="h-64 sm:h-72 flex flex-col justify-between">
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analysis.charts.assetsLiabilities}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {analysis.charts.assetsLiabilities.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] font-bold text-slate-600">
                        {analysis.charts.assetsLiabilities.map((item, index) => (
                          <div key={index} className="flex items-center space-x-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            <span>{item.category}: {formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CHART 3: LIQUIDITY EVOLUTION */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2 font-display">
                      Comparativo de Liquidez: Ano Recente vs Ano Anterior
                    </h4>
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analysis.charts.liquidityEvolution}
                          margin={{ top: 20, right: 10, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="metric" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ borderRadius: "8px", borderColor: "#cbd5e1" }} />
                          <Legend />
                          <Bar name="Ano Anterior" dataKey="previousYear" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                          <Bar name="Ano Atual" dataKey="currentYear" fill="#059669" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHART 4: PROFITABILITY COMPILATION */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2 font-display">
                      Evolução de Margens & Retornos (%)
                    </h4>
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analysis.charts.profitabilityEvolution}
                          margin={{ top: 20, right: 10, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="metric" stroke="#94a3b8" />
                          <YAxis tickFormatter={(v) => `${v}%`} stroke="#94a3b8" />
                          <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, ""]} contentStyle={{ borderRadius: "8px", borderColor: "#cbd5e1" }} />
                          <Legend />
                          <Bar name="Ano Anterior" dataKey="previousYear" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                          <Bar name="Ano Atual" dataKey="currentYear" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: QUALITATIVE REPORT AUDITING */}
            {(activeTab === "qualitative" || window.matchMedia("print").matches) && (
              <div className="space-y-6 print:block">
                {/* Balance Sheet Deep Dive */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                    <Layers className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Parecer sobre o Balanço Patrimonial</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                    {analysis.balanceSheetReport}
                  </p>
                </div>

                {/* DRE Deep Dive */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Parecer sobre a Demonstração do Resultado (DRE)</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                    {analysis.dreReport}
                  </p>
                </div>

                {/* DFC Deep Dive */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                    <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Análise do Fluxo de Caixa (DFC)</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                    {analysis.dfcReport}
                  </p>
                </div>

                {/* Notes Deep Dive */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b pb-2 font-display">
                    <BookOpen className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Takeaways Críticos das Notas Explicativas</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                    {analysis.notesReport}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="no-print border-t border-slate-200 bg-white mt-16 py-6 text-center text-xs text-slate-400 font-mono">
        <p>© {new Date().getFullYear()} ContábilAI • Análise de Demonstrações Fiscais via Google Gemini API</p>
        <p className="mt-1 text-[10px] text-slate-300">Respeitando as diretrizes de gratuidade de cota e limites de taxa de processamento por minuto (RPM).</p>
      </footer>
    </div>
  );
}
