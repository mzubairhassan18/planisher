import { CopyPlus, Library } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div>
      <header className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">Reusable plans</span>
          <h1>Templates</h1>
          <p>Turn a successful project structure into the next calm start.</p>
        </div>
        <button className="primary-button" type="button">
          <CopyPlus aria-hidden="true" size={17} />
          Create template
        </button>
      </header>
      <article className="content-card placeholder-card">
        <Library aria-hidden="true" size={28} />
        <h2>No saved templates yet</h2>
        <p>
          Duplicate Riverside Villa after the schedule prototype is approved;
          tasks and dependencies will copy while historical progress stays behind.
        </p>
      </article>
    </div>
  );
}
