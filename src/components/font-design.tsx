"use client";
export function Textstyle({
  Title="",
  className="",
  color="text-purple",
}: {
  Title: string;
  className?: string;
  color?: string;
}) {
  return (
    <div className="relative">
      <h1 className={`text-shadow ${className} text-borsok`}>{Title}</h1>
      <h1 className={`text-style ${className} text-borsok`}>{Title}</h1>
      <h1 className={`text-inside ${className} ${color} text-borsok`}>{Title}</h1>
    </div>
  );
}

export function Textstylegreen({
  Title="",
  className="",
  color="text-green",
}: {
  Title: string;
  className?: string;
  color?: string;
}) {
  return (
    <div className="relative">
      <h1 className={`text-shadow ${className} text-borsok`}>{Title}</h1>
      <h1 className={`text-style2 ${className} text-borsok`}>{Title}</h1>
      <h1 className={`text-inside ${className} ${color} text-borsok`}>{Title}</h1>
    </div>
  );
}
export function TextstyleEliane({
  Title="",
  className="",
  color="text-purple",
}: {
  Title: string;
  className?: string;
  color?: string;
}) {
  return (
    <div className="relative">
      <h1 className={`text-shadow ${className} text-eliane`}>{Title}</h1>
      <h1 className={`text-style ${className} text-eliane`}>{Title}</h1>
      <h1 className={`text-inside ${className} ${color} text-eliane`}>{Title}</h1>
    </div>
  );
}
export function TextstyleElianeGreen({
  Title="",
  className="",
  color="text-green",
}: {
  Title: string;
  className?: string;
  color?: string;
}) {
  return (
    <div className="relative">
      <h1 className={`text-shadow ${className} text-eliane`}>{Title}</h1>
      <h1 className={`text-style2 ${className} text-eliane`}>{Title}</h1>
      <h1 className={`text-inside ${className} ${color} text-eliane`}>{Title}</h1>
    </div>
  );
}

