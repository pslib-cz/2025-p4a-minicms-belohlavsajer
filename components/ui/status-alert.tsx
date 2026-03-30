import { Alert } from "react-bootstrap";

type StatusAlertProps = {
    message?: string | null;
    variant?: string;
    className?: string;
};

export function StatusAlert({
    message,
    variant = "danger",
    className,
}: StatusAlertProps) {
    if (!message) {
        return null;
    }

    return (
        <Alert variant={variant} className={className}>
            {message}
        </Alert>
    );
}
