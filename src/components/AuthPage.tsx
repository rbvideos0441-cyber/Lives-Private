/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { Sparkles, Key, Mail, User, ShieldAlert, BadgeCheck, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { login, registerUser, users, config } = usePlatform();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup States
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('USER');

  // General States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier.trim()) {
      setError('Por favor, informe seu usuário ou e-mail.');
      return;
    }

    const res = login(loginIdentifier.trim(), loginPassword);
    if (!res.success) {
      setError(res.error || 'Erro ao realizar login.');
    } else {
      setSuccess('Login efetuado com sucesso!');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signupUsername.trim()) {
      setError('Escolha um nome de usuário.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (signupPassword.length < 4) {
      setError('Sua senha deve ter no mínimo 4 caracteres.');
      return;
    }

    const res = registerUser(
      signupUsername,
      signupEmail,
      signupPassword,
      signupRole
    );

    if (!res.success) {
      setError(res.error || 'Erro ao cadastrar conta.');
    } else {
      setSuccess('Parabéns! Conta cadastrada com sucesso.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-150 flex flex-col justify-center items-center p-4 selection:bg-pink-600 selection:text-white">
      {/* Background Decorative Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Logo and Brand Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 shadow-lg shadow-pink-600/15 mb-2 font-display font-black text-2xl text-white tracking-wider">
            V
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-white">
            {config.platformName}
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Plataforma VIP de transmissões de áudio e vídeo sob demanda em tempo real.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => {
              setActiveTab('LOGIN');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'border-pink-500 text-white font-black'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setActiveTab('SIGNUP');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'SIGNUP'
                ? 'border-pink-500 text-white font-black'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Notifications and Feedback Alerts */}
        {error && (
          <div className="flex items-center gap-2.5 bg-red-950/25 border border-red-900/40 text-red-400 p-3 rounded-xl text-xs">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 p-3 rounded-xl text-xs">
            <BadgeCheck size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Forms */}
        {activeTab === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">Usuário ou E-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. juliana_bella ou juliana@gmail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">Sua senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Key size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Informe sua senha secreta"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-10 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 active:scale-98 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-pink-600/10 cursor-pointer"
            >
              Acessar Conta VIP
            </button>

            {/* Hint for easier initial login */}
            <div className="pt-2 border-t border-gray-850 text-center">
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
                💡 Contas de demonstração para testes rápidos:<br/>
                <span className="text-pink-400 font-semibold">@robson</span> ou <span className="text-pink-400 font-semibold">robsonbatista3@gmail.com</span> (Dono Geral 👑)<br/>
                <span className="text-gray-400">Senha: </span><span className="text-pink-400/95 font-mono font-semibold">25041981044181Rbb@</span><br/>
                <span className="text-pink-400/80 font-mono font-semibold">@juliana_bella</span> (Host Oficial)<br/>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">Nome de Usuário (@)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. maria_vip"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">E-mail de Contato</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. maria@gmail.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">Senha Secreta</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Key size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="No mínimo 4 dígitos"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-10 text-xs placeholder-gray-600 focus:outline-none focus:border-pink-500 text-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Role/Account Type Selection */}
            <div className="space-y-1.5">
              <label className="text-3xs font-mono uppercase tracking-wider text-gray-400">Nível / Tipo de Conta</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSignupRole('USER')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    signupRole === 'USER'
                      ? 'bg-pink-950/25 border-pink-500/50 text-pink-400 font-bold'
                      : 'bg-gray-950 border-gray-850 text-gray-400 hover:border-gray-800'
                  }`}
                >
                  <p className="text-xs">Espectador 👥</p>
                  <p className="text-[9px] mt-0.5 opacity-70 font-sans font-normal">Ganha 200 moedas grátis</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole('HOST')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    signupRole === 'HOST'
                      ? 'bg-gradient-to-tr from-pink-950/20 to-indigo-950/20 border-pink-500/50 text-pink-300 font-bold shadow-lg shadow-pink-500/5'
                      : 'bg-gray-950 border-gray-850 text-gray-400 hover:border-gray-800'
                  }`}
                >
                  <p className="text-xs">Host Broadcaster 💄</p>
                  <p className="text-[9px] mt-0.5 opacity-70 font-sans font-normal">Faz lives e vende fotos</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 active:scale-98 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Criar Conta e Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
