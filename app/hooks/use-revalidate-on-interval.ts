import { useRevalidator } from "@remix-run/react";
import { useEffect } from "react";

interface Options {
    enabled?: boolean;
    interval?: number;
  }
  
  export default function useRevalidateOnInterval({
    enabled = false,
    interval = 10000, // 10 seconds
  }: Options) {
    let revalidate = useRevalidator();
    useEffect(
      function revalidateOnInterval() {
        if (!enabled) return;
        let intervalId = setInterval(revalidate.revalidate, interval);
        return () => clearInterval(intervalId);
      },
      [revalidate],
    );
  }