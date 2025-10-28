import { useState } from 'react'
import { analyzeCompany } from '../api/client'
import { CircularProgress } from '@mui/material'
import { Sparkles } from 'lucide-react'

export default function NomiPulsePage() {
  const [company, setCompany] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!company) return
    setLoading(true)
    setResponse('')
    try {
      const result = await analyzeCompany(company)
      setResponse(result.insight)
    } catch (err) {
      setResponse('⚠️ Something went wrong while analyzing this company.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full">
      {/* Header */}
      <h1 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text">
        NOMI Pulse
      </h1>
      <p className="text-gray-400 mb-8">Your AI Compliance & Market Intelligence Assistant</p>

      {/* Input + Button */}
      <div className="flex w-full max-w-2xl items-center gap-3">
        <input
          type="text"
          placeholder="Enter a company name (e.g., Apple)"
          className="flex-grow p-3 rounded-xl border border-gray-600 bg-gray-900 text-white outline-none focus:ring-2 focus:ring-blue-500"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all"
        >
          <Sparkles size={18} />
          {loading ? 'Analyzing...' : 'Generate Insight'}
        </button>
      </div>

      {/* Response Section */}
      <div className="w-full max-w-3xl mt-10 bg-gray-950/50 border border-gray-800 rounded-2xl p-6 min-h-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <CircularProgress />
          </div>
        ) : response ? (
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {response}
          </div>
        ) : (
          <div className="text-gray-500 italic text-center">
            Ask NOMI Pulse to analyze any company’s filings or competitors.
          </div>
        )}
      </div>
    </div>
  )
}