import service from "@/service/service";
import { Button, Form, Input } from "antd";
import { toast } from "sonner";

export default function SignupTab({ setActiveKey }: any) {
  const [form] = Form.useForm();

  const onFinish = () => {
    const { username, password, rePassword, email, fullName } =
      form.getFieldsValue();
    if (password !== rePassword) {
      form.setFields([
        {
          name: "rePassword",
          errors: ["The two passwords that you entered do not match!"],
        },
      ]);
      return;
    }
    service
      .post("/auth/signup", { username, password, email, fullName })
      .then((res: any) => {
        toast(res.data.message);
        setActiveKey("1");
      })
      .catch((err) => {
        //add loading
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
        rules={[{ required: true, message: "Please enter your username!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please enter your password!" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Re-enter password"
        name="rePassword"
        rules={[{ required: true, message: "Please re-enter your password!" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please enter your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Full Name"
        name="fullName"
        rules={[
          { required: true, message: "Please enter your full name!" },
          {
            message: "Please enter at least 2 characters!",
            min: 2,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        className="w-[10rem] self-center"
      >
        Sign Up
      </Button>
    </Form>
  );
}
