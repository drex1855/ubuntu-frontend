import { useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/feedback/ToastContext";
import { useAuth } from "../auth/AuthContext";
import {
  createProduct,
  deleteProduct,
  getDebts,
  getMyDebt,
  getProducts,
  getSales,
  registerDebtPayment,
  registerSale,
  updateProduct,
} from "../api/inventory";
import { getModelAccounts } from "../api/modelAccounts";
import { ApiError } from "../api/client";
import type { ModelAccountDto, ModelDebtDto, ProductDto, StoreSaleDto } from "../api/types";
import { formatDateTime, formatPesos } from "../utils/format";
import shared from "./shared.module.css";
import styles from "./StorePage.module.css";

type ModalState =
  | { mode: "create-product" }
  | { mode: "edit-product"; product: ProductDto }
  | { mode: "sale" }
  | { mode: "payment" }
  | { mode: "history"; modelAccountId: string; modelFullName: string }
  | null;

export function StorePage() {
  const { hasRole } = useAuth();
  const isStaff = hasRole("Admin") || hasRole("Monitor");

  return isStaff ? <StoreStaffView /> : <StoreModelView />;
}

function StoreModelView() {
  const { data: debt, loading, error } = useApi(getMyDebt, []);

  return (
    <AppShell title="Tienda">
      <Card title="Mi cuenta en la tienda" subtitle="Total acumulado por lo que has tomado">
        {loading && <Spinner />}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {!loading && !error && debt && (
          <div className={styles.debtHero}>
            <div
              className={`${styles.debtValue} ${debt.totalDebt > 0 ? styles.debtValuePositive : styles.debtValueZero}`}
            >
              {formatPesos(debt.totalDebt)}
            </div>
            <div className={styles.debtLabel}>
              {debt.totalDebt > 0
                ? "Puedes ponerte al día hablando con el estudio."
                : "Estás al día, no tienes nada pendiente."}
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}

function StoreStaffView() {
  const { data: products, loading, error, reload } = useApi(getProducts, []);
  const { data: debts, loading: loadingDebts, reload: reloadDebts } = useApi(getDebts, []);
  const { data: models } = useApi(getModelAccounts, []);
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <AppShell title="Tienda">
      <Card
        title="Productos"
        subtitle=""
        action={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="secondary" onClick={() => setModal({ mode: "create-product" })}>
              + Producto
            </Button>
            <Button onClick={() => setModal({ mode: "sale" })} disabled={!products?.length || !models?.length}>
              Agregar consumo
            </Button>
          </div>
        }
      >
        {loading && <Spinner />}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {!loading && !error && (products?.length ?? 0) === 0 && (
          <EmptyState title="Sin productos todavía" description="Da de alta el primer producto de la tienda." />
        )}
        {!loading && (products?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products!.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={() => setModal({ mode: "edit-product", product })}
                  onDeleted={reload}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card
        title="Cuentas por modelo"
        subtitle="Lo que cada modelo lleva acumulado en la tienda"
        action={
          <Button variant="secondary" size="small" onClick={() => setModal({ mode: "payment" })} disabled={!models?.length}>
            Registrar abono
          </Button>
        }
      >
        {loadingDebts && <Spinner />}
        {!loadingDebts && (debts?.length ?? 0) === 0 && (
          <EmptyState title="Sin consumos registrados" description="Nadie ha tomado productos todavía." />
        )}
        {!loadingDebts && (debts?.length ?? 0) > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Total acumulado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {debts!.map((debt) => (
                <DebtRow
                  key={debt.modelAccountId}
                  debt={debt}
                  onViewHistory={() =>
                    setModal({ mode: "history", modelAccountId: debt.modelAccountId, modelFullName: debt.modelFullName })
                  }
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modal?.mode === "create-product" && (
        <CreateProductModal onClose={() => setModal(null)} onCreated={() => { setModal(null); reload(); }} />
      )}
      {modal?.mode === "edit-product" && (
        <EditProductModal
          product={modal.product}
          onClose={() => setModal(null)}
          onUpdated={() => { setModal(null); reload(); }}
        />
      )}
      {modal?.mode === "sale" && products && models && (
        <SaleModal
          products={products}
          models={models}
          onClose={() => setModal(null)}
          onRegistered={() => { setModal(null); reloadDebts(); }}
        />
      )}
      {modal?.mode === "payment" && models && (
        <PaymentModal
          models={models}
          onClose={() => setModal(null)}
          onRegistered={() => { setModal(null); reloadDebts(); }}
        />
      )}
      {modal?.mode === "history" && (
        <HistoryModal
          modelAccountId={modal.modelAccountId}
          modelFullName={modal.modelFullName}
          onClose={() => setModal(null)}
        />
      )}
    </AppShell>
  );
}

function ProductRow({
  product,
  onEdit,
  onDeleted,
}: {
  product: ProductDto;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${product.name}" de la tienda? Ya no aparecerá en el catálogo.`)) return;

    setDeleting(true);
    try {
      await deleteProduct(product.id);
      showSuccess("Producto eliminado.");
      onDeleted();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr>
      <td data-label="Producto">{product.name}</td>
      <td data-label="Precio">{formatPesos(product.price)}</td>
      <td>
        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
          <Button variant="secondary" size="small" onClick={onEdit}>
            Editar
          </Button>
          <Button variant="danger" size="small" onClick={handleDelete} loading={deleting}>
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function DebtRow({ debt, onViewHistory }: { debt: ModelDebtDto; onViewHistory: () => void }) {
  return (
    <tr>
      <td data-label="Modelo">{debt.modelFullName}</td>
      <td data-label="Total acumulado">
        <Badge tone={debt.totalDebt > 0 ? "warning" : "success"} dot>
          {formatPesos(debt.totalDebt)}
        </Badge>
      </td>
      <td>
        <Button variant="secondary" size="small" onClick={onViewHistory}>
          Ver historial
        </Button>
      </td>
    </tr>
  );
}

function CreateProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (price < 0) {
      setFormError("El precio no puede ser negativo.");
      return;
    }

    setSubmitting(true);
    try {
      await createProduct({ name: name.trim(), price });
      showSuccess("Producto creado correctamente.");
      onCreated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear el producto.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo producto" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Nombre" htmlFor="productName" required>
          <input
            id="productName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Precio" htmlFor="price" required>
          <input
            id="price"
            type="number"
            min={0}
            step="any"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditProductModal({
  product,
  onClose,
  onUpdated,
}: {
  product: ProductDto;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (price < 0) {
      setFormError("El precio no puede ser negativo.");
      return;
    }

    setSubmitting(true);
    try {
      await updateProduct(product.id, { name: name.trim(), price });
      showSuccess("Producto actualizado correctamente.");
      onUpdated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo actualizar el producto.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Editar producto" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Nombre" htmlFor="editProductName" required>
          <input
            id="editProductName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Precio" htmlFor="editPrice" required>
          <input
            id="editPrice"
            type="number"
            min={0}
            step="any"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SaleModal({
  products,
  models,
  onClose,
  onRegistered,
}: {
  products: ProductDto[];
  models: ModelAccountDto[];
  onClose: () => void;
  onRegistered: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [modelAccountId, setModelAccountId] = useState(models[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"pagado" | "credito">("credito");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!productId || !modelAccountId || quantity <= 0) {
      setFormError("Selecciona producto, modelo y una cantidad mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      const sale = await registerSale({
        productId,
        modelAccountId,
        quantity,
        isCredit: paymentMethod === "credito",
      });
      showSuccess(
        paymentMethod === "credito"
          ? `Agregado a su cuenta por ${formatPesos(sale.totalAmount)}.`
          : `Registrado como pagado por ${formatPesos(sale.totalAmount)}.`,
      );
      onRegistered();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar el consumo.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Agregar consumo" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Modelo" htmlFor="saleModel" required>
          <select id="saleModel" value={modelAccountId} onChange={(e) => setModelAccountId(e.target.value)} style={{ width: "100%" }}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Producto" htmlFor="saleProduct" required>
          <select id="saleProduct" value={productId} onChange={(e) => setProductId(e.target.value)} style={{ width: "100%" }}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {formatPesos(product.price)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Cantidad" htmlFor="saleQuantity" required>
          <input
            id="saleQuantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <FormField label="Forma de pago" htmlFor="saleCredit" required>
          <select
            id="saleCredit"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "pagado" | "credito")}
            style={{ width: "100%" }}
          >
            <option value="pagado">Pagado en el momento</option>
            <option value="credito">A crédito (se suma a su cuenta)</option>
          </select>
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentModal({
  models,
  onClose,
  onRegistered,
}: {
  models: ModelAccountDto[];
  onClose: () => void;
  onRegistered: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [modelAccountId, setModelAccountId] = useState(models[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!modelAccountId || amount <= 0) {
      setFormError("Selecciona una modelo e ingresa un monto mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      await registerDebtPayment({ modelAccountId, amount });
      showSuccess("Abono registrado correctamente.");
      onRegistered();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar el abono.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Registrar abono" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} noValidate>
        {formError && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{formError}</p>}

        <FormField label="Modelo" htmlFor="paymentModel" required>
          <select
            id="paymentModel"
            value={modelAccountId}
            onChange={(e) => setModelAccountId(e.target.value)}
            style={{ width: "100%" }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Monto" htmlFor="paymentAmount" required>
          <input
            id="paymentAmount"
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </FormField>

        <div className={shared.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Registrar abono
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function HistoryModal({
  modelAccountId,
  modelFullName,
  onClose,
}: {
  modelAccountId: string;
  modelFullName: string;
  onClose: () => void;
}) {
  const { data: sales, loading, error } = useApi(() => getSales(modelAccountId), [modelAccountId]);

  return (
    <Modal title={`Historial de ${modelFullName}`} onClose={onClose}>
      {loading && <Spinner />}
      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {!loading && !error && (sales?.length ?? 0) === 0 && (
        <EmptyState title="Sin consumos registrados" description="Esta modelo todavía no ha tomado productos." />
      )}
      {!loading && (sales?.length ?? 0) > 0 && (
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Forma de pago</th>
              </tr>
            </thead>
            <tbody>
              {sales!.map((sale: StoreSaleDto) => (
                <tr key={sale.id}>
                  <td data-label="Fecha">{formatDateTime(sale.soldAt)}</td>
                  <td data-label="Producto">{sale.productName}</td>
                  <td data-label="Cantidad">{sale.quantity}</td>
                  <td data-label="Total">{formatPesos(sale.totalAmount)}</td>
                  <td data-label="Forma de pago">
                    <Badge tone={sale.isCredit ? "warning" : "success"} dot>
                      {sale.isCredit ? "A crédito" : "Pagado"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <div className={shared.formActions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
