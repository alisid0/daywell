export default function Link({ href, children, ...rest }) {
  return <a href={typeof href === "string" ? href : href?.pathname ?? "#"} {...rest}>{children}</a>;
}
