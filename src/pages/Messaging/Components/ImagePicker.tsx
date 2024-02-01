import { ImageIcon } from "lucide-react";

export default function ImagePicker({ setImages }: any) {
  return (
    <>
      <label
        className="py-2 px-1 relative text-2xl cursor-pointer hover:text-[#6899d9] transition-all duration-100"
        htmlFor="imageInput"
      >
        <ImageIcon size={30} />
      </label>
      <input
        id="imageInput"
        type="file"
        className="hidden"
        multiple
        accept=".jpg, .jpeg, .png"
        onChange={(e) => {
          setImages((prev: any) => [...prev, ...e.target.files]);
        }}
      />
    </>
  );
}
