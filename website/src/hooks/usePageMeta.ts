import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
}

const usePageMeta = ({ title, description }: PageMeta) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") || "";
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    } else {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      metaDesc.setAttribute("content", description);
      document.head.appendChild(metaDesc);
    }

    // OG tags
    const setOg = (prop: string, content: string) => {
      const el = document.querySelector(`meta[property="${prop}"]`);
      if (el) {
        el.setAttribute("content", content);
      }
    };
    setOg("og:title", title);
    setOg("og:description", description);

    return () => {
      document.title = prev;
      if (metaDesc) metaDesc.setAttribute("content", prevDesc);
    };
  }, [title, description]);
};

export default usePageMeta;
