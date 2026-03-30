import { ReactNode } from "react";
import { Form } from "react-bootstrap";

type FormFieldProps = {
    controlId: string;
    label: string;
    className?: string;
    children: ReactNode;
};

export function FormField({
    controlId,
    label,
    className = "mb-3",
    children,
}: FormFieldProps) {
    return (
        <Form.Group className={className} controlId={controlId}>
            <Form.Label>{label}</Form.Label>
            {children}
        </Form.Group>
    );
}
