import service from "@/service/service";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginTab() {
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const onFinish = () => {
    const { username, password } = form.getFieldsValue();
    service
      .post("/auth/login", { username, password })
      .then((res: any) => {
        localStorage.setItem("token", res.data.results);
        navigate("/");
      })
      .catch((err) => {
        toast(err.response.data.message);
      });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="w-full flex flex-col"
      onFinish={onFinish}
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        className="w-[10rem] self-center"
      >
        Login
      </Button>
    </Form>
  );
}
