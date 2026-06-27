import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = 5000;

/* =========================
   KONFIGURASI
========================= */

const JWT_SECRET = "aw-laundry-secret-key-2024";

const ADMIN_USER = {
  username: "admin",
  password: "admin123",
};

app.use(cors());
app.use(express.json());

/* =========================
   CEK ENV
========================= */

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan di file .env");
  process.exit(1);
}


/* =========================
   KONEKSI SUPABASE
========================= */

let supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);

/* =========================
   TEST SERVER
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AW Laundry API (Supabase) berjalan",
  });
});

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server OK",
  });
});

/* =========================
   MIDDLEWARE JWT
========================= */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token tidak ditemukan",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token tidak valid atau kedaluwarsa",
      });
    }

    req.user = user;
    next();
  });
};

/* =========================
   LOGIN ADMIN
========================= */

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== ADMIN_USER.username ||
    password !== ADMIN_USER.password
  ) {
    return res.status(401).json({
      success: false,
      message: "Username atau password salah",
    });
  }

  const token = jwt.sign(
    { username },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    success: true,
    message: "Login berhasil",
    token,
  });
});

/* =========================
   TAMBAH PESANAN
========================= */

app.post("/pesanan", async (req, res) => {
  try {
    const {
      nota,
      nama,
      hp,
      alamat,
      layanan,
      status,
    } = req.body;

    const { data, error } = await supabase
      .from("pesanan")
      .insert([
        {
          nota,
          nama,
          hp,
          alamat: alamat || "",
          layanan,
          status: status || "Menunggu Penjemputan",
        },
      ])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Pesanan berhasil disimpan",
      data: data[0],
    });
  } catch (err) {
    console.error("❌ Gagal tambah pesanan:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   AMBIL SEMUA PESANAN
========================= */

app.get("/pesanan", verifyToken, async (req, res) => {
  try {
    console.log("📥 GET /pesanan");

    const { data, error } = await supabase
      .from("pesanan")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("❌ ERROR GET /pesanan");
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   TRACKING BY INVOICE
========================= */

app.get("/tracking/:kode", async (req, res) => {
  try {
    const kode = req.params.kode.toUpperCase();

    const { data, error } = await supabase
      .from("pesanan")
      .select("*")
      .ilike("nota", kode);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: data[0],
    });
  } catch (err) {
    console.error("❌ Gagal tracking:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   TRACKING BY HP
========================= */

app.get("/tracking/hp/:hp", async (req, res) => {
  try {
    const hp = req.params.hp;

    const { data, error } = await supabase
      .from("pesanan")
      .select("*")
      .eq("hp", hp)
      .order("tanggal", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan untuk nomor HP ini",
      });
    }

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("❌ Gagal tracking by HP:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   TRACKING BY ID TRANSAKSI
========================= */

app.get("/tracking/id/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID Transaksi harus berupa angka",
      });
    }

    const { data, error } = await supabase
      .from("pesanan")
      .select("*")
      .eq("id", id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan untuk ID ini",
      });
    }

    res.json({
      success: true,
      data: data[0],
    });
  } catch (err) {
    console.error("❌ Gagal tracking by ID:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   UPDATE STATUS
========================= */

app.put("/pesanan/:nota", verifyToken, async (req, res) => {
  try {
    const { nota } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("pesanan")
      .update({ status })
      .eq("nota", nota)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Status berhasil diperbarui",
      data: data[0],
    });
  } catch (err) {
    console.error("❌ Gagal update status:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   HAPUS PESANAN
========================= */

app.delete("/pesanan/:nota", verifyToken, async (req, res) => {
  try {
    const { nota } = req.params;

    const { data, error } = await supabase
      .from("pesanan")
      .delete()
      .eq("nota", nota)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Pesanan berhasil dihapus",
    });
  } catch (err) {
    console.error("❌ Gagal hapus pesanan:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log("");
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
  console.log("");
  console.log("POST   /login");
  console.log("POST   /pesanan");
  console.log("GET    /pesanan");
  console.log("GET    /tracking/:kode");
  console.log("GET    /tracking/hp/:hp");
  console.log("GET    /tracking/id/:id");
  console.log("PUT    /pesanan/:nota");
  console.log("DELETE /pesanan/:nota");
  console.log("");
});