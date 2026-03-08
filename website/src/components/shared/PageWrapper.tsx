import { useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

const PageWrapper = ({ title, description, children }: Props) => {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
  }, [title, description]);

  return <>{children}</>;
};

export default PageWrapper;
