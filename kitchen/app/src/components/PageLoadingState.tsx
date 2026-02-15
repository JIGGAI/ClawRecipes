import { Container, Button } from "react-bootstrap";
import { LoadingSpinner } from "./LoadingSpinner";

type Props = {
  loading: boolean;
  error?: string | null;
  loadingMessage: string;
  /** Optional retry callback; when provided, error state shows a Retry button */
  onRetry?: () => void;
  children: React.ReactNode;
};

export function PageLoadingState({
  loading,
  error,
  loadingMessage,
  onRetry,
  children,
}: Props) {
  if (loading) {
    return (
      <Container fluid="lg" className="py-4">
        <LoadingSpinner message={loadingMessage} className="text-center py-5 text-muted" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid="lg" className="py-4">
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{error}</p>
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
