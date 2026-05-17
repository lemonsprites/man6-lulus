'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

// ========== KONFIGURASI SEKOLAH (GANTI DI SINI) ==========
const SCHOOL_CONFIG = {
  name: "MTSN 1 CIAMIS",           // Ganti nama sekolahmu
  logo: "🎓",                       // Bisa ganti emoji atau gambar
  primaryColor: "indigo",           // Warna utama (indigo, emerald, sky, dll)
  secondaryColor: "cyan",           // Warna sekunder
}

// ========== TIPE DATA ==========
type ResultType = {
  id: number
  nopen: string
  nama: string
  asal_sekolah: string | null
  nomor_hp: string | null
  ukuran_baju: string | null
  status_kelulusan: string
}

export default function Home() {
  const [nopen, setNopen] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const checkGraduation = async () => {
    const trimmed = nopen.trim()
    if (!trimmed) {
      setError('No Pendaftaran tidak boleh kosong')
      setResult(null)
      return
    }

    setError('')
    setResult(null)
    setLoading(true)

    try {
      // Query langsung berdasarkan nopen (unik)
      const { data, error: dbError } = await supabase
        .from('tb_kelulusan')
        .select('*')
        .eq('nopen', trimmed)
        .single()

      if (dbError || !data) {
        setError(`No Pendaftaran "${trimmed}" tidak ditemukan.`)
        setLoading(false)
        return
      }

      setResult({
        id: data.id,
        nopen: data.nopen,
        nama: data.nama,
        asal_sekolah: data.asal_sekolah || '-',
        nomor_hp: data.nomor_hp || '-',
        ukuran_baju: data.ukuran_baju || '-',
        status_kelulusan: data.status_kelulusan || 'LULUS',
      })
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat menghubungi server.')
    } finally {
      setLoading(false)
    }
  }

  const generateFromTemplate = async (templatePath: string, data: any) => {
    const response = await fetch(templatePath)
    if (!response.ok) throw new Error(`Template tidak ditemukan: ${templatePath}`)
    const arrayBuffer = await response.arrayBuffer()
    const zip = new PizZip(arrayBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
    })
    doc.render(data)
    return doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  }

  const commonData = result && {
    id: result.id,
    nopen: result.nopen,
    nama: result.nama,
    asal_sekolah: result.asal_sekolah,
    nomor_hp: result.nomor_hp,
    ukuran_baju: result.ukuran_baju,
    status: result.status_kelulusan,
    tanggal: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    sekolah: SCHOOL_CONFIG.name,
  }

  const downloadFile = async (template: string, filename: string) => {
    if (!result || !commonData) return
    try {
      const blob = await generateFromTemplate(template, commonData)
      saveAs(blob, `${filename}_${result.nama.replace(/\s/g, '_')}.docx`)
    } catch (err) {
      console.error(err)
      alert(`Gagal mengunduh dokumen.\nPastikan template tersedia di folder public/`)
    }
  }

  // Gradient warna dinamis
  const gradientClass = `from-${SCHOOL_CONFIG.primaryColor}-50 via-white to-${SCHOOL_CONFIG.secondaryColor}-50`
  const buttonGradient = `from-${SCHOOL_CONFIG.primaryColor}-600 to-${SCHOOL_CONFIG.primaryColor}-700`

  const isLulus = result?.status_kelulusan === 'LULUS'

  return (
    <main className={`min-h-screen bg-gradient-to-br ${gradientClass} py-8 px-4 sm:py-12 sm:px-6`}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 border border-white/50">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-5xl sm:text-6xl mb-2 sm:mb-3 animate-bounce">{SCHOOL_CONFIG.logo}</div>
            <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              CEK KELULUSAN<br className="hidden sm:block" />{SCHOOL_CONFIG.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Portal resmi pengecekan kelulusan siswa</p>
          </div>

          {/* Form Pencarian berdasarkan NOPEN */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No Pendaftaran (NOPEN)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={nopen}
                  onChange={(e) => setNopen(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && checkGraduation()}
                  className="flex-1 rounded-xl border-gray-300 px-4 py-3 border focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base font-mono"
                  placeholder="Contoh: 2026.27.0.001"
                  disabled={loading}
                />
                <button
                  onClick={checkGraduation}
                  disabled={loading}
                  className={`bg-${SCHOOL_CONFIG.primaryColor}-600 hover:bg-${SCHOOL_CONFIG.primaryColor}-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md text-base`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memeriksa...
                    </>
                  ) : (
                    'Cek Kelulusan'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Masukkan No Pendaftaran sesuai format yang diterima</p>
            </div>

            {loading && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg text-blue-800 text-center animate-pulse text-sm sm:text-base">
                ⏳ Sedang memeriksa data...
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm sm:text-base">
                ⚠️ {error}
              </div>
            )}

            {result && (
              <div className="mt-6 animate-fadeInUp">
                {/* Card Status Kelulusan */}
                <div className={`relative overflow-hidden rounded-2xl shadow-xl p-5 sm:p-8 text-center ${isLulus
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-red-500 to-rose-600'
                  } text-white`}>
                  <div className="text-6xl sm:text-7xl mb-3">
                    {isLulus ? '✅' : '❌'}
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-bold">
                    {isLulus ? 'LULUS' : 'TIDAK LULUS'}
                  </h2>
                  <p className="text-base sm:text-xl opacity-90 mt-2">
                    {isLulus
                      ? 'Selamat! Anda dinyatakan lulus.'
                      : 'Mohon maaf, Anda belum dinyatakan lulus.'}
                  </p>
                </div>

                {/* Detail Data Siswa */}
                <div className="bg-white rounded-2xl shadow-lg mt-4 p-5 border border-gray-100">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">📋 Data Pendaftar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">No Pendaftaran</span>
                      <p className="font-semibold font-mono text-sm">{result.nopen}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Nama Lengkap</span>
                      <p className="font-semibold">{result.nama}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Asal Sekolah</span>
                      <p className="font-semibold">{result.asal_sekolah}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Nomor HP</span>
                      <p className="font-semibold">{result.nomor_hp}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Ukuran Baju</span>
                      <p className="font-semibold">{result.ukuran_baju}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Status</span>
                      <p className={`font-semibold ${isLulus ? 'text-green-600' : 'text-red-600'}`}>
                        {result.status_kelulusan}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Download (hanya jika lulus) */}
                  {isLulus && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3 border-t">
                      <button
                        onClick={() => downloadFile('/template-keterangan.docx', 'Surat_Keterangan')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 rounded-xl text-sm sm:text-base active:scale-95 transition-transform"
                      >
                        📄 Surat Keterangan (DOCX)
                      </button>
                      <button
                        onClick={() => downloadFile('/template-pernyataan.docx', 'Surat_Pernyataan')}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-5 rounded-xl text-sm sm:text-base active:scale-95 transition-transform"
                      >
                        📝 Surat Pernyataan (DOCX)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </main>
  )
}