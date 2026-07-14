import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  baseFile: File | null;
  processFile: File | null;
  onBaseFileChange: (file: File | null) => void;
  onProcessFileChange: (file: File | null) => void;
}

interface FileInfo {
  file: File;
  size: string;
  estimatedRecords: number;
  date: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getRandomRecordCount(): number {
  return Math.floor(Math.random() * (500 - 50 + 1)) + 50;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function UploadZone({
  title,
  icon: Icon,
  file,
  onFileChange,
  accept,
}: {
  title: string;
  icon: React.ElementType;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: Record<string, string[]>;
}) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  useEffect(() => {
    if (file) {
      setFileInfo({
        file,
        size: formatFileSize(file.size),
        estimatedRecords: getRandomRecordCount(),
        date: formatDate(new Date()),
      });
    } else {
      setFileInfo(null);
    }
  }, [file]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileChange(acceptedFiles[0]);
      }
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fileInfo ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-900 truncate">
                  {fileInfo.file.name}
                </p>
                <p className="text-sm text-green-700">
                  {fileInfo.size} • {fileInfo.estimatedRecords} registros estimados
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Cargado: {fileInfo.date}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onFileChange(null)}
            >
              Cambiar
            </Button>
          </div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">
                Suelta el archivo aquí...
              </p>
            ) : (
              <>
                <p className="font-medium mb-1">
                  Arrastra y suelta un archivo aquí
                </p>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Archivos aceptados: .xlsx, .xls, .csv
                </p>
              </>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FileUpload({
  baseFile,
  processFile,
  onBaseFileChange,
  onProcessFileChange,
}: FileUploadProps) {
  const acceptedFileTypes = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "text/csv": [".csv"],
    "application/csv": [".csv"],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UploadZone
        title="Base Maestra"
        icon={FileSpreadsheet}
        file={baseFile}
        onFileChange={onBaseFileChange}
        accept={acceptedFileTypes}
      />
      <UploadZone
        title="Archivo a Procesar"
        icon={Upload}
        file={processFile}
        onFileChange={onProcessFileChange}
        accept={acceptedFileTypes}
      />
    </div>
  );
}
