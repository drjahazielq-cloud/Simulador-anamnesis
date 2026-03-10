import React, { useState, useEffect, useRef } from 'react';
import { CLINICAL_CASES } from './constants';
import { PatientCase, Message, Evaluation, Attempt, Difficulty } from './types';
import { getPatientResponse, evaluateInterview } from './services/gemini';
import { 
  Stethoscope, 
  User, 
  Send, 
  ArrowLeft, 
  Brain, 
  Heart, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  History,
  Play,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const CaseCard = ({ caseData, onSelect }: { caseData: PatientCase, onSelect: (c: PatientCase) => void, key?: string }) => {
  const difficultyColor = {
    [Difficulty.BASIC]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [Difficulty.INTERMEDIATE]: 'bg-amber-100 text-amber-700 border-amber-200',
    [Difficulty.ADVANCED]: 'bg-rose-100 text-rose-700 border-rose-200'
  }[caseData.difficulty];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(caseData)}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColor}`}>
          {caseData.difficulty}
        </span>
        <div className="p-2 bg-slate-50 rounded-lg">
          <User className="w-5 h-5 text-slate-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-1">{caseData.name}</h3>
      <p className="text-sm text-slate-500 mb-4">{caseData.age} años • {caseData.gender}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-400" />
          <span>Motivo: {caseData.chiefComplaint}</span>
        </div>
      </div>
      <button className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
        <Play className="w-4 h-4" />
        Iniciar Simulación
      </button>
    </motion.div>
  );
};

const SimulationView = ({ caseData, onEnd }: { caseData: PatientCase, onEnd: (transcript: Message[], evaluation: Evaluation) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hola doctor(a), soy ${caseData.name}. Vengo porque ${caseData.chiefComplaint.toLowerCase()}.`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await getPatientResponse(caseData, [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinish = async () => {
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateInterview(caseData, messages);
      onEnd(messages, evaluation);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-bottom border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
            <User className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{caseData.name}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{caseData.difficulty} • {caseData.chiefComplaint}</p>
          </div>
        </div>
        <button 
          onClick={handleFinish}
          disabled={messages.length < 3 || isEvaluating}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isEvaluating ? 'Evaluando...' : 'Finalizar Consulta'}
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta al paciente..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          Recuerda usar lenguaje claro y empático • Formula preguntas abiertas cuando sea posible
        </p>
      </div>
    </div>
  );
};

const EvaluationReport = ({ evaluation, onBack }: { evaluation: Evaluation, onBack: () => void }) => {
  const metrics = [
    { label: 'Empatía', value: evaluation.metrics.empathy, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Lógica Clínica', value: evaluation.metrics.logic, icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Claridad', value: evaluation.metrics.clarity, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Completitud', value: evaluation.metrics.completeness, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Resultado de la Simulación</h2>
            <p className="text-slate-400">Evaluación formativa basada en competencias clínicas</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-emerald-400">{evaluation.score}</div>
            <div className="text-xs uppercase tracking-widest font-bold text-slate-500 mt-1">Puntaje Total</div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className={`${m.bg} p-6 rounded-2xl border border-white shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <m.icon className={`w-6 h-6 ${m.color}`} />
                <span className="text-2xl font-bold text-slate-900">{m.value}/10</span>
              </div>
              <p className="text-sm font-semibold text-slate-600">{m.label}</p>
              <div className="mt-3 h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value * 10}%` }}
                  className={`h-full ${m.color.replace('text', 'bg')}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 pb-8 space-y-8">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Retroalimentación del Docente Virtual
            </h3>
            <p className="text-slate-700 leading-relaxed italic">"{evaluation.feedback}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Fortalezas
              </h4>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Áreas de Mejora
              </h4>
              <ul className="space-y-2">
                {evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">Preguntas Sugeridas para este Caso</h4>
            <div className="grid grid-cols-1 gap-3">
              {evaluation.suggestedQuestions.map((q, i) => (
                <div key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900 flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400" />
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={onBack}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Panel Principal
      </button>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'simulation' | 'evaluation' | 'history'>('dashboard');
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await fetch('/api/attempts');
      const data = await res.json();
      setAttempts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const startSimulation = (c: PatientCase) => {
    setSelectedCase(c);
    setView('simulation');
  };

  const finishSimulation = async (transcript: Message[], evaluation: Evaluation) => {
    const attempt: Attempt = {
      id: Math.random().toString(36).substr(2, 9),
      caseId: selectedCase!.id,
      date: Date.now(),
      transcript,
      evaluation
    };

    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt)
      });
      fetchAttempts();
    } catch (error) {
      console.error(error);
    }

    setCurrentEvaluation(evaluation);
    setView('evaluation');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SimulAnamnesis</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Educación Médica Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`text-sm font-bold flex items-center gap-2 transition-colors ${view === 'dashboard' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Brain className="w-4 h-4" /> Casos
            </button>
            <button 
              onClick={() => setView('history')}
              className={`text-sm font-bold flex items-center gap-2 transition-colors ${view === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History className="w-4 h-4" /> Mi Progreso
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">Estudiante de Medicina</p>
                <p className="text-[10px] text-slate-400">Nivel 4 • 1,240 XP</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Selecciona un Paciente</h2>
                  <p className="text-slate-500 max-w-2xl text-lg">
                    Practica tus habilidades de interrogatorio clínico con pacientes virtuales. 
                    Cada caso está diseñado para evaluar competencias específicas.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulaciones</p>
                      <p className="text-xl font-black text-slate-900">{attempts.length}</p>
                    </div>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio</p>
                      <p className="text-xl font-black text-slate-900">
                        {attempts.length > 0 
                          ? Math.round(attempts.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / attempts.length)
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {CLINICAL_CASES.map(c => (
                  <CaseCard key={c.id} caseData={c} onSelect={startSimulation} />
                ))}
              </div>

              <div className="bg-slate-900 rounded-3xl p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-bold mb-4">Recomendaciones Pedagógicas</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-4">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">1</div>
                      <p className="text-slate-300">Inicia con preguntas abiertas para permitir que el paciente relate su padecimiento.</p>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">2</div>
                      <p className="text-slate-300">No olvides explorar antecedentes personales y familiares relevantes al motivo de consulta.</p>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">3</div>
                      <p className="text-slate-300">Mantén un lenguaje profesional pero comprensible para el nivel educativo del paciente.</p>
                    </li>
                  </ul>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                <Stethoscope className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 rotate-12" />
              </div>
            </motion.div>
          )}

          {view === 'simulation' && selectedCase && (
            <motion.div 
              key="simulation"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <SimulationView caseData={selectedCase} onEnd={finishSimulation} />
            </motion.div>
          )}

          {view === 'evaluation' && currentEvaluation && (
            <EvaluationReport evaluation={currentEvaluation} onBack={() => setView('dashboard')} />
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Historial de Desempeño</h2>
                <button 
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </div>

              {attempts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes simulaciones</h3>
                  <p className="text-slate-500">Completa tu primer caso para ver tu progreso aquí.</p>
                  <button 
                    onClick={() => setView('dashboard')}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Ver Casos Disponibles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {attempts.map((a) => {
                    const caseData = CLINICAL_CASES.find(c => c.id === a.caseId);
                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between hover:border-slate-300 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                            <Stethoscope className="w-7 h-7 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{caseData?.name || 'Caso Desconocido'}</h4>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              {new Date(a.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Puntaje</p>
                            <p className={`text-2xl font-black ${a.evaluation!.score >= 80 ? 'text-emerald-500' : a.evaluation!.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                              {a.evaluation?.score}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentEvaluation(a.evaluation!);
                              setView('evaluation');
                            }}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Stethoscope className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">SimulAnamnesis v1.0</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Guía de Uso</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Ética y Privacidad</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Soporte Técnico</a>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            © 2024 Equipo Multidisciplinario de Educación Médica
          </p>
        </div>
      </footer>
    </div>
  );
}
