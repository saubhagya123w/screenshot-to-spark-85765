import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePrototype } from "./prototype-store";
import { PageHeading, Panel, Status } from "./shared";
export function AccountSettings({ profileOnly = false }: { profileOnly?: boolean }) {
  const { data, setData } = usePrototype();
  const [profile, setProfile] = useState(data.profile);
  return (
    <>
      <PageHeading
        title={profileOnly ? "Profile & account" : "Settings"}
        subtitle={
          profileOnly
            ? "Your consultant identity and workspace account."
            : "Manage your profile, privacy preferences and notifications."
        }
      />
      <div className="workspace-grid">
        <div className="space-y-6">
          <Panel title="Consultant profile">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setData((x) => ({ ...x, profile }));
                toast.success("Profile saved.");
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="avatar !w-14 !h-14 !text-xl">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{profile.role}</div>
                </div>
              </div>
              <div className="form-grid">
                {[
                  ["Consultant Name", "name"],
                  ["Email", "email"],
                  ["Organisation", "organisation"],
                  ["Role", "role"],
                ].map(([l, k]) => (
                  <label className="field" key={k}>
                    {l}
                    <Input
                      type={k === "email" ? "email" : "text"}
                      required
                      value={profile[k as keyof typeof profile]}
                      onChange={(e) => setProfile({ ...profile, [String(k)]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <Button type="submit">
                <Check />
                Save Profile
              </Button>
            </form>
          </Panel>
          {!profileOnly && (
            <>
              <Panel title="Session security">
                <div className="security-row">
                  Inactivity sleep<span className="font-medium">2 minutes · Fixed</span>
                </div>
                <div className="security-row">
                  Re-authentication after sleep
                  <Status status="Required" />
                </div>
                <div className="security-row">
                  Default session access<span className="text-muted-foreground">Owner only</span>
                </div>
                <div className="security-row">
                  Collaboration<span className="text-muted-foreground">Explicit invitation</span>
                </div>
                <p className="security-note">
                  Signed-in owners manage their sessions. Invited accounts have view-only access.
                </p>
              </Panel>
              {[
                [
                  "Data protection preferences",
                  [
                    "Confidential data identification",
                    "Sensitive-data filtering",
                    "Masking",
                    "Anonymisation",
                    "Pseudonymisation",
                  ],
                ],
                [
                  "Notifications",
                  [
                    "Session invitations",
                    "Session approvals",
                    "Session completion",
                    "Automated analytics completion",
                    "Report delivery",
                  ],
                ],
              ].map(([title, keys]) => (
                <Panel key={String(title)} title={String(title)}>
                  {(keys as string[]).map((k) => (
                    <div className="security-row" key={k}>
                      <label htmlFor={k}>{k}</label>
                      <Switch
                        id={k}
                        checked={data.preferences[k] ?? false}
                        onCheckedChange={(checked) => {
                          setData((x) => ({
                            ...x,
                            preferences: { ...x.preferences, [k]: checked },
                          }));
                          toast.success("Preference saved.");
                        }}
                      />
                    </div>
                  ))}
                  {title === "Data protection preferences" && (
                    <p className="security-note">
                      Review detected identifiers and protection methods before approving data. Detection uses field-name and value rules, not a compliance guarantee.
                    </p>
                  )}
                </Panel>
              ))}
            </>
          )}
        </div>
        <Panel title="Account overview">
          <ShieldCheck size={30} className="text-primary mb-4" />
          <h3 className="font-semibold">Consultant workspace</h3>
          <p className="text-xs text-muted-foreground mt-2">{data.profile.organisation}</p>
          <div className="my-5">
            <Status status="Signed-in account" />
          </div>
          <div className="security-row">
            Secure sessions<span>{data.sessions.length}</span>
          </div>
          <div className="security-row">
            Monthly configurations<span>{data.automations.length}</span>
          </div>
          <p className="security-note flex items-start gap-2">
            <LockKeyhole size={13} className="shrink-0 mt-1" />
            Review your organisation’s data-handling requirements before uploading confidential information.
          </p>
        </Panel>
      </div>
    </>
  );
}
