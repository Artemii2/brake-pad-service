import type { FormEvent } from "react";
import { Button, Form } from "react-bootstrap";

export type FiltersState = {
  title: string;
};

type Props = {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onApply: () => void;
};

export default function ServiceFilterBar({ value, onChange, onApply }: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply();
  };

  return (
    <Form onSubmit={handleSubmit} className="search-form-lab">
      <div className="search-input-wrap">
        <Form.Control
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="search-input-lab"
          placeholder="Поиск по типу колодок..."
        />
      </div>
      <Button type="submit" className="search-btn-lab" aria-label="Поиск">
        🔍
      </Button>
    </Form>
  );
}
