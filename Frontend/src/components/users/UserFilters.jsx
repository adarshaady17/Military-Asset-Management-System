import { Search } from "lucide-react";
import SectionCard from "../common/SectionCard";
import { Field, SelectInput, TextInput } from "../common/Field";

export default function UserFilters({ filters, bases, onChange }) {
  const update = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <SectionCard
      title="Directory filters"
      subtitle="Find users by identity, role, base, or status."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Search">
          <span className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <TextInput
              className="pl-10"
              value={filters.search}
              onChange={update("search")}
              placeholder="Name or email"
              type="search"
            />
          </span>
        </Field>
        <Field label="Role">
          <SelectInput value={filters.role} onChange={update("role")}>
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BASE_COMMANDER">Base Commander</option>
            <option value="LOGISTICS_OFFICER">Logistics Officer</option>
          </SelectInput>
        </Field>
        <Field label="Base">
          <SelectInput value={filters.base} onChange={update("base")}>
            <option value="">All bases</option>
            {bases.map((base) => (
              <option key={base._id} value={base._id}>
                {base.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput value={filters.status} onChange={update("status")}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectInput>
        </Field>
      </div>
    </SectionCard>
  );
}
