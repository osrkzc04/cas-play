import { useState, type ReactNode } from "react";
import {
  Award,
  BookOpen,
  Eye,
  GraduationCap,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  ProgressBar,
  SectionLabel,
  Select,
  Spinner,
  StarRating,
  StatCard,
  StatusBadge,
  Tabs,
  TextArea,
  type CourseStatus,
} from "@/shared/components";

const badgeTones = [
  "neutral",
  "success",
  "warning",
  "danger",
  "info",
  "gold",
] as const;

interface Swatch {
  name: string;
  value: string;
  className: string;
  dark?: boolean;
}

const brandSwatches: Swatch[] = [
  { name: "brand-50", value: "#FEF2F2", className: "bg-brand-50" },
  { name: "brand-100", value: "#FEE2E2", className: "bg-brand-100" },
  { name: "brand-600", value: "#DE0613", className: "bg-brand-600", dark: true },
  { name: "brand-700", value: "#B80510", className: "bg-brand-700", dark: true },
];

const goldSwatches: Swatch[] = [
  { name: "gold-50", value: "#FDF6EC", className: "bg-gold-50" },
  { name: "gold-100", value: "#FAE9CC", className: "bg-gold-100" },
  { name: "gold-500", value: "#EC9A29", className: "bg-gold-500", dark: true },
  { name: "gold-600", value: "#D4831A", className: "bg-gold-600", dark: true },
];

const neutralSwatches: Swatch[] = [
  { name: "surface", value: "#F5F5F7", className: "bg-surface" },
  { name: "gray-200", value: "#E5E7EB", className: "bg-gray-200" },
  { name: "gray-500", value: "#6B7280", className: "bg-gray-500", dark: true },
  { name: "gray-900", value: "#111827", className: "bg-gray-900", dark: true },
];

const courseStatuses: CourseStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
  "FINISHED",
];

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 className="text-lg font-bold tracking-tightish text-gray-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Swatches({ items }: { items: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((swatch) => (
        <div
          key={swatch.name}
          className="overflow-hidden rounded-lg border border-gray-200"
        >
          <div className={`flex h-16 items-end p-2 ${swatch.className}`}>
            <span
              className={`text-[11px] font-semibold ${swatch.dark ? "text-white" : "text-gray-700"}`}
            >
              {swatch.value}
            </span>
          </div>
          <p className="px-2 py-1 font-mono text-xs text-gray-600">
            {swatch.name}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StyleGuidePage() {
  const [tab, setTab] = useState("colores");
  const [rating, setRating] = useState(4);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Sistema de diseño"
        title="Guía de estilo CAS"
        description="Tokens, primitivos y componentes reutilizables de la plataforma."
      />

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "colores", label: "Color y tipografía" },
            { value: "componentes", label: "Componentes" },
          ]}
        />
      </div>

      {tab === "colores" ? (
        <div className="mt-8 flex flex-col gap-12">
          <Section label="Color" title="Acento institucional (rojo)">
            <p className="text-sm text-gray-500">
              Único color de acento: CTAs, estado activo, progreso y enlaces.
            </p>
            <Swatches items={brandSwatches} />
          </Section>

          <Section label="Color" title="Oro de logro">
            <p className="text-sm text-gray-500">
              Uso restringido: certificados, estrellas y estados de logro.
            </p>
            <Swatches items={goldSwatches} />
          </Section>

          <Section label="Color" title="Neutrales">
            <Swatches items={neutralSwatches} />
          </Section>

          <Section label="Tipografía" title="Inter — escala">
            <Card className="flex flex-col gap-3 p-6">
              <h1 className="text-3xl font-bold tracking-tightish text-gray-900">
                Display / Hero — Inter Bold
              </h1>
              <h2 className="text-xl font-semibold text-gray-900">
                Encabezado de sección — Inter SemiBold
              </h2>
              <p className="text-base text-gray-700">
                Cuerpo de texto — Inter Regular. La experiencia prioriza la
                claridad y el progreso del estudiante.
              </p>
              <SectionLabel>Etiqueta institucional 11px</SectionLabel>
            </Card>
          </Section>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-12">
          <Section label="Acciones" title="Botones">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Comenzar módulo</Button>
              <Button variant="secondary">Cancelar</Button>
              <Button variant="danger">Eliminar lección</Button>
              <Button variant="ghost">Ver más</Button>
              <Button disabled>Deshabilitado</Button>
              <Button isLoading>Guardando</Button>
            </div>
          </Section>

          <Section label="Formularios" title="Campos">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Título del curso" placeholder="Cocina básica" />
              <Input
                label="Correo"
                placeholder="correo@cas.edu.ec"
                error="Ingresa un correo válido."
              />
              <Select
                label="Estado"
                placeholder="Selecciona…"
                options={[
                  { value: "DRAFT", label: "Borrador" },
                  { value: "PUBLISHED", label: "Publicado" },
                ]}
              />
              <TextArea label="Descripción" placeholder="Describe el curso…" />
            </div>
          </Section>

          <Section label="Estados" title="Badges y estados de curso">
            <div className="flex flex-wrap items-center gap-2">
              {courseStatuses.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
              <Badge tone="gold">Certificado</Badge>
              <Badge tone="info">Nuevo</Badge>
            </div>
            <Card className="flex flex-col gap-4 p-6">
              {(["soft", "solid", "outline"] as const).map((variant) => (
                <div key={variant} className="flex flex-col gap-2">
                  <SectionLabel>{variant}</SectionLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    {badgeTones.map((tone) => (
                      <Badge key={tone} tone={tone} variant={variant}>
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </Section>

          <Section label="Acciones" title="Menú de acciones">
            <Card className="flex items-center justify-between gap-4 p-6">
              <p className="text-sm text-gray-600">
                Menú contextual de tres puntos para acciones de fila en tablas.
              </p>
              <DropdownMenu
                items={[
                  { key: "view", label: "Ver detalle", icon: Eye, to: "#" },
                  { key: "edit", label: "Editar", icon: Pencil, to: "#" },
                  {
                    key: "delete",
                    label: "Eliminar",
                    icon: Trash2,
                    tone: "danger",
                    onSelect: () => undefined,
                  },
                ]}
              />
            </Card>
          </Section>

          <Section label="Feedback" title="Alertas">
            <div className="flex flex-col gap-3">
              <Alert tone="success">Evaluación enviada correctamente.</Alert>
              <Alert tone="error">No se pudo cargar el video.</Alert>
              <Alert tone="warning">Te queda 1 intento.</Alert>
              <Alert tone="info">El curso se publicará tras revisión.</Alert>
            </div>
          </Section>

          <Section label="Progreso" title="Barra de progreso y calificación">
            <Card className="flex flex-col gap-5 p-6">
              <ProgressBar value={35} showValue />
              <ProgressBar value={100} showValue />
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} />
                <span className="text-sm text-gray-500">{rating} / 5</span>
              </div>
            </Card>
          </Section>

          <Section label="Métricas" title="Stat cards">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Estudiantes" value={128} icon={Users} />
              <StatCard label="Cursos" value={12} icon={BookOpen} />
              <StatCard
                label="Certificados"
                value={34}
                icon={Award}
                accent="gold"
              />
              <StatCard
                label="Completados"
                value={"82%"}
                icon={GraduationCap}
                accent="gold"
              />
            </div>
          </Section>

          <Section label="Misceláneos" title="Avatar, modal, spinner, vacío">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar initials="OG" />
              <Avatar initials="CA" size="lg" />
              <Spinner />
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Abrir modal
              </Button>
            </div>
            <EmptyState
              icon={BookOpen}
              title="Aún no tienes cursos inscritos"
              description="Explora el catálogo y comienza a aprender hoy."
              action={<Button>Ver catálogo</Button>}
            />
            <Pagination page={page} pages={5} onPageChange={setPage} />
          </Section>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Eliminar módulo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Eliminar
            </Button>
          </>
        }
      >
        Esta acción no se puede deshacer. ¿Deseas continuar?
      </Modal>
    </div>
  );
}
