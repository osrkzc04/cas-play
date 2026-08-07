import { Briefcase, Camera, Video } from "lucide-react";

import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { getInitials } from "@/shared/auth/roles";
import type { InstructorPublic } from "@/modules/instructor-profile/types";

interface InstructorCardProps {
  instructor: InstructorPublic;
}

const socialConfig = [
  { key: "linkedin", label: "LinkedIn", Icon: Briefcase },
  { key: "instagram", label: "Instagram", Icon: Camera },
  { key: "youtube", label: "YouTube", Icon: Video },
] as const;

export function InstructorCard({ instructor }: InstructorCardProps) {
  const fullName = `${instructor.first_name} ${instructor.last_name}`;
  const links = instructor.social_links;
  const socials = socialConfig.filter(({ key }) => Boolean(links?.[key]));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Instructor</h2>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Avatar
          initials={getInitials(instructor.first_name, instructor.last_name)}
          imageUrl={instructor.photo_url ?? undefined}
          size="lg"
          className="h-16 w-16 text-xl"
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{fullName}</p>
            {instructor.specialty && (
              <Badge tone="gold">{instructor.specialty}</Badge>
            )}
          </div>
          {instructor.headline && (
            <p className="text-sm font-medium text-gray-600">
              {instructor.headline}
            </p>
          )}
          {instructor.about_me && (
            <p className="whitespace-pre-line text-sm text-gray-600">
              {instructor.about_me}
            </p>
          )}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {socials.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={links?.[key] ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
