// Custom formatter function
export const formatter = (
  value: any,
  unit: any,
  suffix: any,
  date: any,
  defaultFormatter: any
) => {
  // Handle different units and suffixes to customize the output
  switch (unit) {
    case "second":
    case "minute":
      return value + (unit.startsWith("second") ? "s" : "m");
    case "hour":
      return value + "h";
    case "day":
      return value + "d";
    case "week":
      return value + "w";
    case "month":
      return value + "mo";
    case "year":
      return value + "y";
    default:
      // Fallback to the default formatter for any case not handled above
      return defaultFormatter(value, unit, suffix, date);
  }
};