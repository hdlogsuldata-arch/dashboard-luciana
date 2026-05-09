"use client";

import React from "react";

type Props = { children: React.ReactNode; chartId?: string };
type State = { hasError: boolean };

export default class ChartErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    console.error(`[ChartErrorBoundary${this.props.chartId ? ` ${this.props.chartId}` : ""}]`, err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "#1F1C30",
            border: "1px solid #3E3960",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 260,
            color: "#EF4444",
            fontSize: 13,
            gap: 8,
          }}
        >
          <span>Erro ao renderizar</span>
          <span style={{ color: "#646C7F" }}>{this.props.chartId}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
