import { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useFormSubmit } from "../hooks/useFormSubmit";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { loading, error, submit, clearError } = useFormSubmit();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await submit(async () => {
      await login(username.trim(), password);
      setPassword("");
      navigate("/board", { replace: true });
    });
    if (!ok) setPassword("");
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-body-secondary">
      <Card className="shadow-sm" style={{ width: "100%", maxWidth: 400 }}>
        <Card.Body className="p-4">
          <Card.Title className="mb-3">ClawRecipes Kitchen</Card.Title>
          <Card.Subtitle className="text-body-secondary mb-4">Sign in to continue</Card.Subtitle>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </Form.Group>
            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" variant="primary" disabled={loading} className="w-100">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
