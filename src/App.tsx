import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, RotateCcw } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import FileUpload from "@/components/FileUpload";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { ProgressTracker } from "@/components/ProgressTracker";
import Dashboard from "@/components/Dashboard";
import { ResultsTable } from "@/components/ResultsTable";
import { ActivityPanel } from "@/components/ActivityPanel";
import { Footer } from "@/components/Footer";
import { MapWatermark } from "@/components/MapWatermark";
import { ColombiaMap } from "@/components/ColombiaMap";
import {
  processFilesClientSide,
  downloadResultExcel,
  downloadMasterExcel,
} from "@/api/geocoding";
import type {
  ProcessingConfig,
  ProcessingStatus,
  ActivityLogEntry,
  GeocodingRecord,
  Row,
} from "@/types";

function App() {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [processFile, setProcessFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ProcessingConfig>({
    buscar_en_base_maestra: true,
    buscar_coordenadas_auto: true,
    actualizar_base_maestra: false,
    sobrescribir_coordenadas: false,
    mostrar_sin_encontrar: true,
  });

  const [status, setStatus] = useState<ProcessingStatus>({
    status: "idle",
    progress: 0,
    total: 0,
    procesados: 0,
    encontrados: 0,
    geocodificados: 0,
    no_encontrados: 0,
  });

  const [records, setRecords] = useState<GeocodingRecord[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [masterRows, setMasterRows] = useState<Row[]>([]);
  const [resultFileName, setResultFileName] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canProcess = baseFile !== null && processFile !== null && status.status !== "processing";

  const handleProcess = useCallback(async () => {
    if (!baseFile || !processFile) return;

    setStatus((s) => ({ ...s, status: "processing", progress: 0 }));
    setRecords([]);
    setActivityLog([]);
    setShowResults(false);
    abortRef.current = new AbortController();

    try {
      const result = await processFilesClientSide(
        baseFile,
        processFile,
        config,
        (newStatus) => {
          setStatus(newStatus);
        },
        setActivityLog
      );

      setRecords(result.registros);
      setMasterRows(result.updatedMasterRows);
      setResultFileName(
        processFile.name.replace(/\.xlsx?$/i, "") || "resultado"
      );

      const encontrados = result.registros.filter(
        (r) => r.estado === "encontrado"
      ).length;
      const geocodificados = result.stats.geocoded;
      const noEncontrados = result.stats.notFound;

      setActivityLog((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          message: `Proceso completado: ${result.stats.fromMaster} desde maestra · ${geocodificados} geocodificados · ${noEncontrados} sin coordenadas.`,
          type: "success",
        },
      ]);

      setStatus({
        status: "completed",
        progress: 100,
        total: result.stats.total,
        procesados: result.stats.total,
        encontrados,
        geocodificados,
        no_encontrados: noEncontrados,
      });
      setShowResults(true);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      if (err instanceof Error && err.message === "Cancelado") {
        setActivityLog((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            message: "Procesamiento cancelado por el usuario.",
            type: "warning",
          },
        ]);
        setStatus((s) => ({
          ...s,
          status: "idle",
          mensaje: "Cancelado",
        }));
      } else {
        setStatus((s) => ({
          ...s,
          status: "error",
          mensaje: err instanceof Error ? err.message : "Error desconocido",
        }));
      }
    }
  }, [baseFile, processFile, config]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setBaseFile(null);
    setProcessFile(null);
    setStatus({
      status: "idle",
      progress: 0,
      total: 0,
      procesados: 0,
      encontrados: 0,
      geocodificados: 0,
      no_encontrados: 0,
    });
    setRecords([]);
    setActivityLog([]);
    setShowResults(false);
    setMasterRows([]);
    setResultFileName("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDownloadResult = useCallback(() => {
    if (!records.length) return;
    downloadResultExcel(records, `${resultFileName}_procesado.xlsx`);
  }, [records, resultFileName]);

  const handleDownloadMaster = useCallback(() => {
    if (!masterRows.length) return;
    const base = baseFile?.name.replace(/\.xlsx?$/i, "") || "maestra";
    downloadMasterExcel(masterRows, `${base}_actualizada.xlsx`);
  }, [masterRows, baseFile]);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <MapWatermark />
        <Header />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <HeroSection
                  onGetStarted={() => {
                    document
                      .getElementById("upload-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                />

                <ColombiaMap records={records} />

                <div id="upload-section" className="space-y-8">
                  <FileUpload
                    baseFile={baseFile}
                    processFile={processFile}
                    onBaseFileChange={setBaseFile}
                    onProcessFileChange={setProcessFile}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <ConfigurationPanel
                        config={config}
                        onChange={setConfig}
                        disabled={status.status === "processing"}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <ProgressTracker
                        status={status.status}
                        progress={status.progress}
                        procesados={status.procesados}
                        total={status.total}
                        mensaje={status.mensaje}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button
                      size="lg"
                      onClick={handleProcess}
                      disabled={!canProcess}
                      className="h-12 px-8 text-base font-semibold"
                    >
                      {status.status === "processing" ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              ease: "linear",
                            }}
                            className="inline-block"
                          >
                            <FileSpreadsheet className="mr-2 h-5 w-5" />
                          </motion.span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="mr-2 h-5 w-5" />
                          Iniciar Procesamiento
                        </>
                      )}
                    </Button>
                    {status.status === "processing" && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCancel}
                        className="h-12 px-6 text-base"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div ref={resultsRef}>
                  <Dashboard
                    total={status.total}
                    encontrados={status.encontrados}
                    geocodificados={status.geocodificados}
                    noEncontrados={status.no_encontrados}
                  />
                </div>

                <ColombiaMap records={records} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <ResultsTable records={records} visible={showResults} onRecordsChange={setRecords} />
                  </div>
                  <div className="lg:col-span-1">
                    <ActivityPanel entries={activityLog} visible={showResults} />
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <Button onClick={handleDownloadResult} className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadMaster}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Actualizar Base Maestra
                  </Button>
                  <Button variant="secondary" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Nuevo Proceso
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}

export default App;
